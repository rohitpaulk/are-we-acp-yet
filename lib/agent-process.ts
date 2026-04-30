import { spawn, type ChildProcess } from "node:child_process";
import { Writable, Readable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import type { Agent } from "./agent";

type AgentProcessOptions = {
  client?: Partial<acp.Client>;
  mounts?: { source: string; target: string; readonly?: boolean }[];
};

export class AgentProcess {
  readonly connection: acp.ClientSideConnection;
  private childProcess: ChildProcess;

  constructor(agent: Agent, clientOrOptions?: Partial<acp.Client> | AgentProcessOptions) {
    const options = isAgentProcessOptions(clientOrOptions)
      ? clientOrOptions
      : { client: clientOrOptions };
    const envFlags = agent.envVars.flatMap((v) => ["-e", v]);
    const mountFlags = (options.mounts ?? []).flatMap((mount) => [
      "--mount",
      `type=bind,source=${mount.source},target=${mount.target}${mount.readonly ? ",readonly" : ""}`,
    ]);

    this.childProcess = spawn(
      "docker",
      ["run", "-i", "--rm", ...envFlags, ...mountFlags, agent.imageName],
      {
        stdio: ["pipe", "pipe", "inherit"],
      },
    );

    const input = Writable.toWeb(this.childProcess.stdin!);
    const output = Readable.toWeb(this.childProcess.stdout!) as ReadableStream<Uint8Array>;

    const fullClient: acp.Client = {
      async requestPermission() {
        throw new Error("denied by test client");
      },
      async sessionUpdate() {},
      ...options.client,
    };

    const stream = acp.ndJsonStream(input, output);
    this.connection = new acp.ClientSideConnection((_agent) => fullClient, stream);
  }

  [Symbol.dispose](): void {
    this.childProcess.kill();
  }
}

function isAgentProcessOptions(
  value: Partial<acp.Client> | AgentProcessOptions | undefined,
): value is AgentProcessOptions {
  return !!value && ("client" in value || "mounts" in value);
}
