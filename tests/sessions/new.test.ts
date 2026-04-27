import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { registry } from "../setup";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("session/new returns distinct sessionIds (%s)", async (slug) => {
  const agent = registry.agentBySlug(slug);
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
});
