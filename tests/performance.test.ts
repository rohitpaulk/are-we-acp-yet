import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../lib/agent-process";
import { checkCollectorRegistry, registry } from "./setup";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("responds to initialize within 500ms (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);

  using proc = new AgentProcess(agent);

  const start = performance.now();

  await proc.connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {},
    clientInfo: { name: "acp-verifier", version: "0.1.0" },
  });

  const elapsed = performance.now() - start;

  if (elapsed <= 500) {
    check.pass("boot-time-500ms");
  } else {
    check.fail("boot-time-500ms");
  }
});
