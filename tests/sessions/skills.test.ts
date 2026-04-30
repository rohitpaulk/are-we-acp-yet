import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

const CONTAINER_WORKSPACE = "/workspace/skills-check";
const SKILL_NAME = "acp-verifier-skill";
const SKILL_DESCRIPTION = "Skill used by ACP verifier to check slash command loading.";

test.each(registry.agentSlugs)("loads skills as slash commands (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);
  const hostWorkspace = createWorkspaceWithSkill();
  const updates: acp.SessionUpdate[] = [];

  try {
    using proc = new AgentProcess(agent, {
      mounts: [{ source: hostWorkspace, target: CONTAINER_WORKSPACE }],
      client: {
        async sessionUpdate(params) {
          updates.push(params.update);
        },
      },
    });

    await initAndAuth(proc, agent);

    const loadStart = performance.now();
    const session = await proc.connection.newSession({
      cwd: CONTAINER_WORKSPACE,
      mcpServers: [],
    });

    expect(session.sessionId).toBeTruthy();

    const availableCommands = await waitForAvailableCommands(updates, 5_000);
    const loadElapsed = performance.now() - loadStart;
    const skillCommand = availableCommands.find((command) => command.name === SKILL_NAME);

    if (skillCommand) {
      expect(skillCommand.description).toBeTruthy();
      check.pass("loads-skills");
    } else {
      check.fail("loads-skills");
    }

    if (skillCommand && loadElapsed <= 500) {
      check.pass("loads-skills-500ms");
    } else {
      check.fail("loads-skills-500ms");
    }
  } finally {
    rmSync(hostWorkspace, { recursive: true, force: true });
  }
});

function createWorkspaceWithSkill(): string {
  const workspace = mkdtempSync(join(tmpdir(), "acp-verifier-skills-"));
  const skillDir = join(workspace, ".agents", "skills", SKILL_NAME);
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    join(skillDir, "SKILL.md"),
    `---\nname: ${SKILL_NAME}\ndescription: ${SKILL_DESCRIPTION}\n---\n\nUse this skill only for ACP verifier tests.\n`,
  );
  return resolve(workspace);
}

async function waitForAvailableCommands(
  updates: acp.SessionUpdate[],
  timeoutMs: number,
): Promise<acp.AvailableCommand[]> {
  const deadline = performance.now() + timeoutMs;

  while (performance.now() < deadline) {
    const commands = latestAvailableCommands(updates);
    if (commands) {
      return commands;
    }

    await Bun.sleep(25);
  }

  return latestAvailableCommands(updates) ?? [];
}

function latestAvailableCommands(updates: acp.SessionUpdate[]): acp.AvailableCommand[] | undefined {
  return updates.filter((update) => update.sessionUpdate === "available_commands_update").at(-1)
    ?.availableCommands;
}
