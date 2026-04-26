import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { registry, initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentNames)("%s: session/close succeeds", async (name) => {
  const agent = registry.agentByName(name);
  using proc = new AgentProcess(agent);
  const initResult = await initAndAuth(proc, agent);

  if (!initResult.agentCapabilities?.sessionCapabilities?.close) {
    throw new Error(`${agent.name} does not support session/close`);
  }

  const session = await proc.connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  await proc.connection.closeSession({
    sessionId: session.sessionId,
  });
});
