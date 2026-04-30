import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Agent } from "./agent";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const AGENTS_DIR = resolve(PROJECT_ROOT, "agents");

export class AgentRegistry {
  readonly agents: Agent[];

  constructor() {
    const all = this.discover();
    const filter = process.env.AGENTS?.split(",").map((s) => s.trim()).filter(Boolean);

    if (filter?.length) {
      const unknown = filter.filter((slug) => !all.some((a) => a.slug === slug));
      if (unknown.length) {
        throw new Error(`Unknown agent(s) in AGENTS env var: ${unknown.join(", ")}`);
      }
      this.agents = all.filter((a) => filter.includes(a.slug));
    } else {
      this.agents = all;
    }
  }

  get agentSlugs(): string[] {
    return this.agents.map((a) => a.slug);
  }

  agentBySlug(slug: string): Agent {
    const agent = this.agents.find((a) => a.slug === slug);
    if (!agent) {
      throw new Error(`Unknown agent: ${slug}`);
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
