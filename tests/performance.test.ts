import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../lib/agent-process";
import { checkCollectorRegistry, registry } from "./setup";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)("%s: responds to initialize within 500ms", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);

  using proc = new AgentProcess(agent);

  const start = performance.now();

  await proc.connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {},
    clientInfo: { name: "acp-verifier", version: "0.1.0" },
  });

  if (elapsed > 500) {
    throw new Error(`${agent.slug} took too long to respond to initialize`);
  }
  const elapsed = performance.now() - start;
  expect(elapsed).toBeLessThanOrEqual(500);
});
