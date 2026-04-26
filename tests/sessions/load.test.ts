import { expect, test } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../../lib/agent-process";
import { registry, initAndAuth } from "../helpers";

test.each(registry.agentNames)(
  "%s: session/load replays conversation history when loadSession is supported",
  async (name) => {
    const agent = registry.agentByName(name);
    const updates: acp.SessionUpdate[] = [];

    using proc = new AgentProcess(agent, {
      async sessionUpdate(params) {
        updates.push(params.update);
      },
    });

    const initResult = await initAndAuth(proc, agent);

    if (!initResult.agentCapabilities?.loadSession) {
      return;
    }

    const session = await proc.connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });

    await proc.connection.prompt({
      sessionId: session.sessionId,
      prompt: [{ type: "text", text: "say exactly one word: hello" }],
    });

    const updatesBeforeLoad = updates.length;
    expect(updatesBeforeLoad).toBeGreaterThan(0);

    await proc.connection.loadSession({
      sessionId: session.sessionId,
      cwd: "/tmp",
      mcpServers: [],
    });

    const replayedUpdates = updates.slice(updatesBeforeLoad);
    expect(replayedUpdates.length).toBeGreaterThan(0);
  },
);
