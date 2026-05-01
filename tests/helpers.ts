import { mkdirSync, symlinkSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import * as acp from "@agentclientprotocol/sdk";
import type { Agent } from "../lib/agent";

export async function initAndAuth(
  connection: acp.ClientSideConnection,
  agent: Agent,
  clientCapabilities: acp.ClientCapabilities = {},
) {
  const initResult = await connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities,
    clientInfo: { name: "acp-verifier", version: "0.1.0" },
  });

  if (initResult.authMethods?.length) {
    const envVarMethod = initResult.authMethods.find(
      (m): m is acp.AuthMethodEnvVar & { type: "env_var" } =>
        "type" in m &&
        m.type === "env_var" &&
        m.vars.every((v) => v.optional || agent.envVars.includes(v.name)),
    );

    if (envVarMethod) {
      await connection.authenticate({ methodId: envVarMethod.id });
    }
  }

  return initResult;
}

export function applyAgentSymlinks(agent: Agent, workspace: string): void {
  for (const [symlinkPath, targetPath] of Object.entries(agent.symlinks)) {
    const symlink = join(workspace, symlinkPath);
    const target = relative(dirname(symlink), join(workspace, targetPath));
    mkdirSync(dirname(symlink), { recursive: true });
    symlinkSync(target, symlink, "dir");
  }
}
