import { expect, test } from "bun:test";
import { resolve } from "path";

const CODEX_ACP_BIN = resolve(
  import.meta.dir,
  "..",
  "node_modules",
  ".bin",
  "codex-acp"
);

type JsonRpcMessage = {
  jsonrpc: "2.0";
  id?: number;
  method?: string;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
};

class AcpClient {
  private proc: ReturnType<typeof Bun.spawn>;
  private stdin: import("bun").FileSink;
  private reader: { read(): Promise<{ done: boolean; value?: Uint8Array }> };
  private buffer = "";
  private decoder = new TextDecoder();
  private nextId = 0;

  constructor(bin: string, args: string[] = []) {
    this.proc = Bun.spawn([bin, ...args], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "inherit",
    });
    this.stdin = this.proc.stdin as import("bun").FileSink;
    this.reader = (this.proc.stdout as ReadableStream<Uint8Array>).getReader();
  }

  private send(message: object) {
    this.stdin.write(JSON.stringify(message) + "\n");
  }

  private async readOneMessage(): Promise<JsonRpcMessage> {
    while (true) {
      const nlIndex = this.buffer.indexOf("\n");
      if (nlIndex !== -1) {
        const line = this.buffer.slice(0, nlIndex);
        this.buffer = this.buffer.slice(nlIndex + 1);
        if (line.trim()) {
          return JSON.parse(line);
        }
        continue;
      }
      const { done, value } = await this.reader.read();
      if (done) throw new Error("stdout stream ended unexpectedly");
      this.buffer += this.decoder.decode(value, { stream: true });
    }
  }

  async request(
    method: string,
    params: Record<string, unknown>
  ): Promise<{
    response: JsonRpcMessage;
    notifications: JsonRpcMessage[];
  }> {
    const id = this.nextId++;
    this.send({ jsonrpc: "2.0", id, method, params });

    const notifications: JsonRpcMessage[] = [];
    while (true) {
      const msg = await this.readOneMessage();

      if ("id" in msg && msg.id === id) {
        return { response: msg, notifications };
      }

      if ("method" in msg) {
        if (msg.id !== undefined) {
          this.send({
            jsonrpc: "2.0",
            id: msg.id,
            error: { code: -1, message: "denied by test client" },
          });
        }
        notifications.push(msg);
      }
    }
  }

  async close() {
    this.stdin.end();
    this.proc.kill();
  }
}

function collectAgentText(notifications: JsonRpcMessage[]): string {
  return notifications
    .filter((n) => {
      const update = n.params?.update as { sessionUpdate?: string } | undefined;
      return update?.sessionUpdate === "agent_message_chunk";
    })
    .map((n) => {
      const update = n.params!.update as {
        content: { type: string; text: string };
      };
      return update.content.text;
    })
    .join("");
}

test(
  "codex-acp: agent responds with 'hi' when asked to say one word",
  async () => {
    const client = new AcpClient(CODEX_ACP_BIN);

    try {
      const { response: initResponse } = await client.request("initialize", {
        protocolVersion: 1,
        clientCapabilities: {},
        clientInfo: { name: "acp-verifier", version: "0.1.0" },
      });
      expect(initResponse.error).toBeUndefined();

      const { response: sessionResponse } = await client.request(
        "session/new",
        { cwd: process.cwd(), mcpServers: [] }
      );
      expect(sessionResponse.error).toBeUndefined();
      const sessionId = (sessionResponse.result as { sessionId: string })
        .sessionId;
      expect(sessionId).toBeTruthy();

      // Pick the cheapest available model with lowest reasoning effort
      type ConfigOption = {
        id: string;
        options: { value: string }[];
      };
      const configOptions = (
        sessionResponse.result as { configOptions?: ConfigOption[] }
      ).configOptions;

      if (configOptions) {
        const modelOption = configOptions.find((o) => o.id === "model");
        const reasoningOption = configOptions.find(
          (o) => o.id === "reasoning_effort"
        );

        // Use the last model in the list (typically the cheapest/smallest)
        if (modelOption && modelOption.options.length > 0) {
          const cheapestModel =
            modelOption.options[modelOption.options.length - 1]!.value;
          await client.request("session/set_config_option", {
            sessionId,
            configId: "model",
            value: cheapestModel,
          });
        }

        // Use the lowest reasoning effort
        if (reasoningOption && reasoningOption.options.length > 0) {
          const lowestReasoning = reasoningOption.options[0]!.value;
          await client.request("session/set_config_option", {
            sessionId,
            configId: "reasoning_effort",
            value: lowestReasoning,
          });
        }
      }

      const { response: promptResponse, notifications } =
        await client.request("session/prompt", {
          sessionId,
          prompt: [{ type: "text", text: "say exactly one word: hi" }],
        });

      expect(promptResponse.error).toBeUndefined();
      expect(
        (promptResponse.result as { stopReason: string }).stopReason
      ).toBe("end_turn");

      const agentText = collectAgentText(notifications);
      expect(agentText.trim().toLowerCase()).toBe("hi");
    } finally {
      await client.close();
    }
  },
  60_000
);
