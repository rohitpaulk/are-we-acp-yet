import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const AGENTS_DIR = resolve(PROJECT_ROOT, "agents");

type AgentYAML = {
  name: string;
  env_vars: string[];
};

export class Agent {
  readonly name: string;
  readonly dockerContext: string;
  readonly envVars: string[];

  constructor(opts: { name: string; dockerContext: string; envVars: string[] }) {
    this.name = opts.name;
    this.dockerContext = opts.dockerContext;
    this.envVars = opts.envVars;
  }

  static fromDir(dir: string): Agent {
    const configPath = resolve(AGENTS_DIR, dir, "agent.yaml");
    const raw = readFileSync(configPath, "utf-8");
    const config = parseYaml(raw) as AgentYAML;
    return new Agent({
      name: config.name,
      dockerContext: `agents/${dir}`,
      envVars: config.env_vars,
    });
  }

  get imageName(): string {
    return `acp-verifier-${this.name}`;
  }

  buildImage(): void {
    const missing = this.envVars.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required env vars for ${this.name}: ${missing.join(", ")}`
      );
    }

    const context = resolve(PROJECT_ROOT, this.dockerContext);
    const result = spawnSync(
      "docker",
      ["build", "-t", this.imageName, context],
      { stdio: "inherit" }
    );
    if (result.status !== 0) {
      throw new Error(`Failed to build Docker image for ${this.name}`);
    }
  }
}
