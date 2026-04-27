import { expect, test, setDefaultTimeout } from "bun:test";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("session/close succeeds (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);
  using proc = new AgentProcess(agent);
  const initResult = await initAndAuth(proc, agent);

  if (!initResult.agentCapabilities?.sessionCapabilities?.close) {
    check.fail("supports-session-close");
    return;
  }

  const session = await proc.connection.newSession({
    cwd: "/tmp",
    mcpServers: [],
  });

  await proc.connection.closeSession({
    sessionId: session.sessionId,
  });

  check.pass("supports-session-close");
});
