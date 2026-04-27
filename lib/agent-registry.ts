import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Agent } from "./agent";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const AGENTS_DIR = resolve(PROJECT_ROOT, "agents");

export class AgentRegistry {
  readonly agents: Agent[];

  constructor() {
    this.agents = this.discover();
  }

  get agentNames(): string[] {
    return this.agents.map((a) => a.name);
  }

  agentByName(name: string): Agent {
    const agent = this.agents.find((a) => a.name === name);
    if (!agent) {
      throw new Error(`Unknown agent: ${name}`);
    }
    return agent;
  }

  private discover(): Agent[] {
    const entries = readdirSync(AGENTS_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => Agent.fromDir(e.name));
  }

  async buildAllImages(): Promise<void> {
    console.log();
    for (const agent of this.agents) {
      await agent.buildImage();
    }
    console.log();
  }
}
