import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../../lib/agent-process";
import { registry } from "../setup";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("session/load replays conversation history (%s)", async (slug) => {
  const agent = registry.agentBySlug(slug);
  const updates: acp.SessionUpdate[] = [];

  using proc = new AgentProcess(agent, {
    async sessionUpdate(params) {
      updates.push(params.update);
    },
  });

  const initResult = await initAndAuth(proc, agent);

  if (!initResult.agentCapabilities?.loadSession) {
    throw new Error(`${agent.slug} does not support session/load`);
  }

  const session = await proc.connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  await proc.connection.prompt({
    sessionId: session.sessionId,
    prompt: [{ type: "text", text: "say exactly one word: hello" }],
  });

  const updatesBeforeLoad = updates.length;
  expect(updatesBeforeLoad).toBeGreaterThan(0);

  await proc.connection.loadSession({
    sessionId: session.sessionId,
    cwd: "/tmp",
    mcpServers: [],
  });

  const replayedUpdates = updates.slice(updatesBeforeLoad);
  expect(replayedUpdates.length).toBeGreaterThan(0);
});
