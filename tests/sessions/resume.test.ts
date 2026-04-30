import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import { initAndAuth } from "../helpers";

setDefaultTimeout(15_000);

test.each(registry.agentSlugs)(
  "session/resume (%s)",
  async (slug) => {
    const check = checkCollectorRegistry.get(slug);
    const agent = registry.agentBySlug(slug);
    const updates: acp.SessionUpdate[] = [];

    using proc = new AgentProcess(agent, {
      async sessionUpdate(params) {
        updates.push(params.update);
      },
    });

    const initResult = await initAndAuth(proc, agent);

    if (initResult.agentCapabilities?.sessionCapabilities?.resume) {
      check.pass("supports-session-resume");
    } else {
      check.fail("supports-session-resume");
    }
  },

  // TODO: Check if session/resume functionality actually works
);
