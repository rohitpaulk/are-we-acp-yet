import { expect, test } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../lib/agent-process";
import { registry } from "./helpers";

test.each(registry.agentNames)(
  "%s: responds with matching protocol version when agent supports it",
  async (name) => {
    const agent = registry.agentByName(name);
    using proc = new AgentProcess(agent);

    const result = await proc.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {},
      clientInfo: { name: "acp-verifier", version: "0.1.0" },
    });

    expect(result.protocolVersion).toBe(acp.PROTOCOL_VERSION);
  },
);

test.each(registry.agentNames)(
  "%s: responds with its latest version when client requests an unsupported version",
  async (name) => {
    const agent = registry.agentByName(name);
    using proc = new AgentProcess(agent);

    const result = await proc.connection.initialize({
      protocolVersion: 9,
      clientCapabilities: {},
      clientInfo: { name: "acp-verifier", version: "0.1.0" },
    });

    expect(result.protocolVersion).toBeGreaterThanOrEqual(1);
    expect(result.protocolVersion).toBeLessThanOrEqual(9);
    expect(Number.isInteger(result.protocolVersion)).toBe(true);
  },
);

test.each(registry.agentNames)("%s: includes agentInfo in initialize response", async (name) => {
  const agent = registry.agentByName(name);
  using proc = new AgentProcess(agent);

  const result = await proc.connection.initialize({
    protocolVersion: acp.PROTOCOL_VERSION,
    clientCapabilities: {},
    clientInfo: { name: "acp-verifier", version: "0.1.0" },
  });

  expect(result.agentInfo).toBeDefined();
  expect(result.agentInfo!.name).toBeTruthy();
});

test.each(registry.agentNames)(
  "%s: includes agentCapabilities in initialize response",
  async (name) => {
    const agent = registry.agentByName(name);
    using proc = new AgentProcess(agent);

    const result = await proc.connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {},
      clientInfo: { name: "acp-verifier", version: "0.1.0" },
    });

    expect(result.agentCapabilities).toBeDefined();
  },
);
