import { expect, test } from "bun:test";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { Writable, Readable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import { parse as parseYaml } from "yaml";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const AGENTS_DIR = resolve(PROJECT_ROOT, "agents");

type AgentConfig = {
  name: string;
  env_vars: string[];
};

type Agent = {
  name: string;
  dockerContext: string;
  envVars: string[];
};

function discoverAgents(): Agent[] {
  const entries = readdirSync(AGENTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const configPath = resolve(AGENTS_DIR, e.name, "agent.yaml");
      const raw = readFileSync(configPath, "utf-8");
      const config = parseYaml(raw) as AgentConfig;
      return {
        name: config.name,
        dockerContext: `agents/${e.name}`,
        envVars: config.env_vars,
      };
    });
}

const agents = discoverAgents();

for (const agent of agents) {
  const missing = agent.envVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars for ${agent.name}: ${missing.join(", ")}`
    );
  }

  const context = resolve(PROJECT_ROOT, agent.dockerContext);
  const image = `acp-verifier-${agent.name}`;
  const result = spawnSync("docker", ["build", "-t", image, context], {
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(`Failed to build Docker image for ${agent.name}`);
  }
}

test.each(agents)(
  "%p: agent responds with 'hi' when asked to say one word",
  async (agent) => {
    const image = `acp-verifier-${agent.name}`;
    const envFlags = agent.envVars.flatMap((v) => ["-e", v]);

    const agentProcess = spawn(
      "docker",
      ["run", "-i", "--rm", ...envFlags, image],
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
