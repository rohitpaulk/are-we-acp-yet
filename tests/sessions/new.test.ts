import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { registry, initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentNames)(
  "%s: session/new returns a non-empty sessionId",
  async (name) => {
    const agent = registry.agentByName(name);
    using proc = new AgentProcess(agent);
    await initAndAuth(proc, agent);

    const result = await proc.connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });

    expect(result.sessionId).toBeTruthy();
    expect(typeof result.sessionId).toBe("string");
  },
);

test.each(registry.agentNames)(
  "%s: creating multiple sessions returns distinct sessionIds",
  async (name) => {
    const agent = registry.agentByName(name);
    using proc = new AgentProcess(agent);
    await initAndAuth(proc, agent);

    const first = await proc.connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });
    const second = await proc.connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });

    expect(first.sessionId).not.toBe(second.sessionId);
  },
);
