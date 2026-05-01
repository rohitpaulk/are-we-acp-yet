import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import { parse as parseDotenv } from "dotenv";
import { execa } from "execa";
import chalk from "chalk";

const AGENTS_DIR = resolve(import.meta.dir, "../agents");

type AgentYAML = {
  name: string;
  company: string;
  version_string: string;
  env_vars: string[];
  symlinks?: Record<string, string>;
};

export class Agent {
  readonly slug: string;
  readonly name: string;
  readonly company: string;
  readonly versionString: string;
  readonly dockerContext: string;
  readonly requiredEnvVars: string[];
  readonly env: Record<string, string>;
  readonly symlinks: Record<string, string>;

  constructor(opts: {
    slug: string;
    name: string;
    company: string;
    versionString: string;
    dockerContext: string;
    envVars: string[];
    env: Record<string, string>;
    symlinks: Record<string, string>;
  }) {
    this.slug = opts.slug;
    this.name = opts.name;
    this.company = opts.company;
    this.versionString = opts.versionString;
    this.dockerContext = opts.dockerContext;
    this.requiredEnvVars = opts.envVars;
    this.env = opts.env;
    this.symlinks = opts.symlinks;
  }

  static fromDir(dir: string): Agent {
    const agentDir = resolve(AGENTS_DIR, dir);
    const env = loadEnvFile(resolve(agentDir, ".env"));

    const configPath = resolve(agentDir, "agent.yaml");
    const raw = readFileSync(configPath, "utf-8");
    const config = parseYaml(raw) as AgentYAML;
    return new Agent({
      slug: dir,
      name: config.name,
      company: config.company,
      versionString: config.version_string,
      dockerContext: dir,
      envVars: config.env_vars,
      env,
      symlinks: config.symlinks ?? {},
    });
  }

  get imageName(): string {
    return `acp-verifier-${this.slug}`;
  }

  envValue(name: string): string | undefined {
    return this.env[name] ?? process.env[name];
  }

  async buildImage(): Promise<void> {
    const missing = this.requiredEnvVars.filter((v) => !this.envValue(v));
    if (missing.length > 0) {
      throw new Error(`Missing required env vars for ${this.slug}: ${missing.join(", ")}`);
    }

    const prefix = chalk.cyan(`[build-${this.slug}]`);
    const context = resolve(AGENTS_DIR, this.dockerContext);

    const proc = execa("docker", ["build", "-t", this.imageName, context]);

    proc.stdout?.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString().split("\n")) {
        if (line) process.stdout.write(`${prefix} ${line}\n`);
      }
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString().split("\n")) {
        if (line) process.stderr.write(`${prefix} ${line}\n`);
      }
    });

    await proc;
  }
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  return parseDotenv(readFileSync(path));
}
