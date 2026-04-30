import { spawn, type ChildProcess } from "node:child_process";
import { Writable, Readable } from "node:stream";
import * as acp from "@agentclientprotocol/sdk";
import type { Agent } from "./agent";

type AgentProcessOptions = {
  mounts?: { source: string; target: string; readonly?: boolean }[];
};

export class AgentProcess {
  connection?: acp.ClientSideConnection;
  private childProcess: ChildProcess;

  constructor(agent: Agent, options: AgentProcessOptions = {}) {
    const envFlags = agent.envVars.flatMap((v) => {
      const value = agent.envValue(v);
      return value === undefined ? [] : ["-e", `${v}=${value}`];
    });

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
  }

  connect(clientOptions: Partial<acp.Client> = {}): acp.ClientSideConnection {
    if (this.connection) {
      throw new Error("AgentProcess already has an active connection");
    }

    const input = Writable.toWeb(this.childProcess.stdin!);
    const output = Readable.toWeb(this.childProcess.stdout!) as ReadableStream<Uint8Array>;

    const client: acp.Client = {
      async requestPermission() {
        throw new Error("denied by test client");
      },

      async sessionUpdate() {},

      ...clientOptions,
    };

    const stream = acp.ndJsonStream(input, output);
    this.connection = new acp.ClientSideConnection((_agent) => client, stream);

    return this.connection;
  }

  [Symbol.dispose](): void {
    this.childProcess.kill();
  }
}
