import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../lib/agent-process";
import { registry } from "./helpers";

setDefaultTimeout(15_000);

test.each(registry.agentNames)("%s: responds to initialize within 500ms", async (name) => {
  const agent = registry.agentByName(name);
  using proc = new AgentProcess(agent);

  const start = performance.now();

  await proc.connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {},
    clientInfo: { name: "acp-verifier", version: "0.1.0" },
  });

  const elapsed = performance.now() - start;
  expect(elapsed).toBeLessThanOrEqual(500);
});
