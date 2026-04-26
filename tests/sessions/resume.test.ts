import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../../lib/agent-process";
import { registry, initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentNames)(
  "%s: session/resume does not replay conversation history",
  async (name) => {
    const agent = registry.agentByName(name);
    const updates: acp.SessionUpdate[] = [];

    using proc = new AgentProcess(agent, {
      async sessionUpdate(params) {
        updates.push(params.update);
      },
    });

    const initResult = await initAndAuth(proc, agent);

    if (!initResult.agentCapabilities?.sessionCapabilities?.resume) {
      throw new Error(`${agent.name} does not support session/resume`);
    }

    const session = await proc.connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });

    await proc.connection.prompt({
      sessionId: session.sessionId,
      prompt: [{ type: "text", text: "say exactly one word: hello" }],
    });

    const updatesBeforeResume = updates.length;

    await proc.connection.resumeSession({
      sessionId: session.sessionId,
      cwd: "/tmp",
      mcpServers: [],
    });

    const replayedUpdates = updates.slice(updatesBeforeResume);
    expect(replayedUpdates.length).toBe(0);
  },
);
