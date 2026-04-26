import { expect, test } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { registry, initAndAuth } from "../helpers";

test.each(registry.agentNames)(
  "%s: session/close succeeds when close is supported",
  async (name) => {
    const agent = registry.agentByName(name);
    using proc = new AgentProcess(agent);
    const initResult = await initAndAuth(proc, agent);

    if (!initResult.agentCapabilities?.sessionCapabilities?.close) {
      return;
    }

    const session = await proc.connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });

    await proc.connection.closeSession({
      sessionId: session.sessionId,
    });
  },
);
