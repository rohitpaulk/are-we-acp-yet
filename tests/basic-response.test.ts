import { expect, test } from "bun:test";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { Writable, Readable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import { AgentRegistry } from "../lib/agent-registry";

const PROJECT_ROOT = resolve(import.meta.dir, "..");

const registry = new AgentRegistry();
registry.buildAllImages();

test.each(registry.agents)(
  "%p: agent responds with 'hi' when asked to say one word",
  async (agent) => {
    const envFlags = agent.envVars.flatMap((v) => ["-e", v]);

    const agentProcess = spawn(
      "docker",
      ["run", "-i", "--rm", ...envFlags, agent.imageName],
      { stdio: ["pipe", "pipe", "inherit"] }
    );

    const input = Writable.toWeb(agentProcess.stdin!);
    const output = Readable.toWeb(
      agentProcess.stdout!
    ) as ReadableStream<Uint8Array>;

    const agentTextChunks: string[] = [];

    const client: acp.Client = {
      async requestPermission(_params) {
        throw new Error("denied by test client");
      },
      async sessionUpdate(params) {
        const update = params.update;
        if (
          update.sessionUpdate === "agent_message_chunk" &&
          update.content.type === "text"
        ) {
          agentTextChunks.push(update.content.text);
        }
      },
    };

    const stream = acp.ndJsonStream(input, output);
    const connection = new acp.ClientSideConnection(
      (_agent) => client,
      stream
    );

    try {
      const initResult = await connection.initialize({
        protocolVersion: acp.PROTOCOL_VERSION,
        clientCapabilities: {},
        clientInfo: { name: "acp-verifier", version: "0.1.0" },
      });

      if (initResult.authMethods?.length) {
        const envVarMethod = initResult.authMethods.find(
          (m): m is acp.AuthMethodEnvVar & { type: "env_var" } =>
            "type" in m &&
            m.type === "env_var" &&
            m.vars.every((v) => v.optional || agent.envVars.includes(v.name))
        );
        if (envVarMethod) {
          await connection.authenticate({ methodId: envVarMethod.id });
        }
      }

      const sessionResult = await connection.newSession({
        cwd: process.cwd(),
        mcpServers: [],
      });
      expect(sessionResult.sessionId).toBeTruthy();

      const configOptions = sessionResult.configOptions;

      if (configOptions) {
        for (const [id, pickIndex] of [
          ["model", -1],
          ["reasoning_effort", 0],
        ] as const) {
          const option = configOptions.find((o) => o.id === id);
          if (!option || option.type !== "select") continue;

          const flatOptions = option.options.flatMap((o) =>
            "options" in o ? o.options : [o]
          );
          if (flatOptions.length === 0) continue;

          const picked =
            flatOptions.at(pickIndex) ?? flatOptions[flatOptions.length - 1]!;
          await connection.setSessionConfigOption({
            sessionId: sessionResult.sessionId,
            configId: id,
            value: picked.value,
          });
        }
      }

      const promptResult = await connection.prompt({
        sessionId: sessionResult.sessionId,
        prompt: [{ type: "text", text: "say exactly one word: hi" }],
      });

      expect(promptResult.stopReason).toBe("end_turn");

      const agentText = agentTextChunks.join("");
      expect(agentText.trim().toLowerCase()).toBe("hi");
    } finally {
      agentProcess.kill();
    }
  },
  60_000
);
