import { existsSync } from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { expect, test, setDefaultTimeout } from "bun:test";
import * as acp from "@agentclientprotocol/sdk";
import { AgentProcess } from "../../lib/agent-process";
import { checkCollectorRegistry, registry } from "../setup";
import { initAndAuth } from "../helpers";

setDefaultTimeout(45_000);

const COMMAND_OUTPUT = "acp-verifier-terminal-output";

test.each(registry.agentSlugs)("terminal commands (%s)", async (slug) => {
  const check = checkCollectorRegistry.get(slug);
  const agent = registry.agentBySlug(slug);
  const terminalClient = new TestTerminalClient();
  const updates: acp.SessionUpdate[] = [];

  using proc = new AgentProcess(agent);
  const connection = proc.connect({
    async sessionUpdate(params) {
      updates.push(params.update);
    },
    async requestPermission(params) {
      const allowedOption = params.options.find(
        (option) => option.kind === "allow_once" || option.kind === "allow_always",
      );

      if (!allowedOption) {
        return { outcome: { outcome: "cancelled" } };
      }

      return { outcome: { outcome: "selected", optionId: allowedOption.optionId } };
    },
    createTerminal: terminalClient.createTerminal,
    terminalOutput: terminalClient.terminalOutput,
    waitForTerminalExit: terminalClient.waitForTerminalExit,
    killTerminal: terminalClient.killTerminal,
    releaseTerminal: terminalClient.releaseTerminal,
  });

  try {
    await initAndAuth(connection, agent, { terminal: true });

    const session = await connection.newSession({
      cwd: "/tmp",
      mcpServers: [],
    });

    expect(session.sessionId).toBeTruthy();

    await connection.prompt({
      sessionId: session.sessionId,
      prompt: [
        {
          type: "text",
          text: `Run a terminal command that prints exactly ${JSON.stringify(COMMAND_OUTPUT)} and then finishes. Use the ACP terminal capability rather than simulating the output.`,
        },
      ],
    });

    if (terminalClient.createdTerminals.length > 0) {
      check.pass("executes-terminal-commands");
    } else {
      check.fail("executes-terminal-commands");
    }

    if (terminalClient.outputRequests.length > 0) {
      check.pass("streams-terminal-command-output");
    } else {
      check.fail("streams-terminal-command-output");
    }

    const terminalIdsInUpdates = terminalIdsEmbeddedInToolCalls(updates);
    if (terminalIdsInUpdates.length > 0) {
      check.pass("displays-terminal-command-when-in-progress");
    } else {
      check.fail("displays-terminal-command-when-in-progress");
    }

    const displayedOutput = await terminalOutputWasDisplayed(updates, terminalClient);
    if (displayedOutput) {
      check.pass("displays-terminal-command-output");
    } else {
      check.fail("displays-terminal-command-output");
    }
  } finally {
    await terminalClient.releaseAll();
  }
});

class TestTerminalClient {
  readonly createdTerminals: acp.CreateTerminalRequest[] = [];
  readonly outputRequests: acp.TerminalOutputRequest[] = [];
  readonly terminals = new Map<string, TestTerminal>();
  readonly releasedTerminalOutputs = new Map<string, string>();

  createTerminal = async (
    params: acp.CreateTerminalRequest,
  ): Promise<acp.CreateTerminalResponse> => {
    const id = randomUUID();
    const terminal = new TestTerminal(params);
    this.createdTerminals.push(params);
    this.terminals.set(id, terminal);
    return { terminalId: id };
  };

  terminalOutput = async (
    params: acp.TerminalOutputRequest,
  ): Promise<acp.TerminalOutputResponse> => {
    this.outputRequests.push(params);
    return this.getTerminal(params.terminalId).currentOutput();
  };

  waitForTerminalExit = async (
    params: acp.WaitForTerminalExitRequest,
  ): Promise<acp.WaitForTerminalExitResponse> => {
    return this.getTerminal(params.terminalId).waitForExit();
  };

  killTerminal = async (params: acp.KillTerminalRequest): Promise<acp.KillTerminalResponse> => {
    this.getTerminal(params.terminalId).kill();
    return {};
  };

  releaseTerminal = async (
    params: acp.ReleaseTerminalRequest,
  ): Promise<acp.ReleaseTerminalResponse> => {
    const terminal = this.getTerminal(params.terminalId);
    await terminal.release();
    this.releasedTerminalOutputs.set(params.terminalId, terminal.currentOutput().output);
    this.terminals.delete(params.terminalId);
    return {};
  };

  async releaseAll(): Promise<void> {
    await Promise.all([...this.terminals.values()].map((terminal) => terminal.release()));
    this.terminals.clear();
  }

  private getTerminal(id: string): TestTerminal {
    const terminal = this.terminals.get(id);
    if (!terminal) {
      throw new Error(`Unknown terminal: ${id}`);
    }
    return terminal;
  }
}

class TestTerminal {
  private readonly childProcess: ChildProcess;
  private output = "";
  private truncated = false;
  private exitStatus: acp.TerminalExitStatus | null | undefined;
  private readonly exited: Promise<acp.TerminalExitStatus>;
  private readonly outputByteLimit?: number | null;

  constructor(params: acp.CreateTerminalRequest) {
    this.outputByteLimit = params.outputByteLimit;
    this.childProcess = spawn(params.command, params.args ?? [], {
      cwd: validCwd(params.cwd),
      env: applyEnvironment(params.env),
      stdio: ["ignore", "pipe", "pipe"],
    });

    this.childProcess.stdout?.on("data", (chunk: Buffer) => this.appendOutput(chunk));
    this.childProcess.stderr?.on("data", (chunk: Buffer) => this.appendOutput(chunk));

    this.exited = new Promise((resolve) => {
      this.childProcess.on("error", (error) => {
        this.appendOutput(Buffer.from(`${error.message}\n`));
        this.exitStatus = { exitCode: 1, signal: null };
        resolve(this.exitStatus);
      });

      this.childProcess.on("exit", (exitCode, signal) => {
        this.exitStatus = {
          exitCode,
          signal,
        };
        resolve(this.exitStatus);
      });
    });
  }

  currentOutput(): acp.TerminalOutputResponse {
    return {
      output: this.output,
      truncated: this.truncated,
      exitStatus: this.exitStatus,
    };
  }

  async waitForExit(): Promise<acp.WaitForTerminalExitResponse> {
    return this.exited;
  }

  kill(): void {
    if (!this.childProcess.killed && this.exitStatus === undefined) {
      this.childProcess.kill();
    }
  }

  async release(): Promise<void> {
    this.kill();
    await Promise.race([this.exited, Bun.sleep(1_000)]);
  }

  private appendOutput(chunk: Buffer): void {
    this.output += chunk.toString();

    if (this.outputByteLimit && Buffer.byteLength(this.output) > this.outputByteLimit) {
      this.truncated = true;
      while (Buffer.byteLength(this.output) > this.outputByteLimit) {
        this.output = this.output.slice(1);
      }
    }
  }
}

function applyEnvironment(env?: acp.EnvVariable[]): NodeJS.ProcessEnv {
  const result = { ...process.env };

  for (const variable of env ?? []) {
    result[variable.name] = variable.value;
  }

  return result;
}

function validCwd(cwd?: string | null): string | undefined {
  return cwd && existsSync(cwd) ? cwd : undefined;
}

function terminalIdsEmbeddedInToolCalls(updates: acp.SessionUpdate[]): string[] {
  return updates.flatMap((update) =>
    toolCallContent(update)
      .filter(
        (content): content is acp.Terminal & { type: "terminal" } => content.type === "terminal",
      )
      .map((content) => content.terminalId),
  );
}

async function terminalOutputWasDisplayed(
  updates: acp.SessionUpdate[],
  terminalClient: TestTerminalClient,
): Promise<boolean> {
  const terminalIds = terminalIdsEmbeddedInToolCalls(updates);
  await waitUntilTerminalOutputIncludes(terminalClient, terminalIds, COMMAND_OUTPUT, 1_000);

  return terminalIds.some((terminalId) => {
    const terminal = terminalClient.terminals.get(terminalId);
    const output =
      terminal?.currentOutput().output ?? terminalClient.releasedTerminalOutputs.get(terminalId);
    return output?.includes(COMMAND_OUTPUT) ?? false;
  });
}

async function waitUntilTerminalOutputIncludes(
  terminalClient: TestTerminalClient,
  terminalIds: string[],
  text: string,
  timeoutMs: number,
): Promise<void> {
  const deadline = performance.now() + timeoutMs;

  while (performance.now() < deadline) {
    if (
      terminalIds.some((terminalId) => {
        const terminal = terminalClient.terminals.get(terminalId);
        const output =
          terminal?.currentOutput().output ??
          terminalClient.releasedTerminalOutputs.get(terminalId);
        return output?.includes(text) ?? false;
      })
    ) {
      return;
    }

    await Bun.sleep(25);
  }
}

function toolCallContent(update: acp.SessionUpdate): acp.ToolCallContent[] {
  if (update.sessionUpdate !== "tool_call" && update.sessionUpdate !== "tool_call_update") {
    return [];
  }

  return update.content ?? [];
}
