import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Agent } from "./agent";

const AGENTS_DIR = resolve(import.meta.dir, "../agents");

export class AgentRegistry {
  readonly agents: Agent[];

  constructor() {
    const agents = this.#discover();

    const agentsFilter = process.env.AGENTS?.split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (agentsFilter?.length) {
      const invalidAgentSlugs = agentsFilter.filter((slug) => !agents.some((agent) => agent.slug === slug));

      if (invalidAgentSlugs.length) {
        throw new Error(`Invalid AGENTS filter: ${invalidAgentSlugs.join(", ")}`);
      }

      this.agents = agents.filter((agent) => agentsFilter.includes(agent.slug));
    } else {
      this.agents = agents;
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

  async buildAllImages(): Promise<void> {
    console.log();
    for (const agent of this.agents) {
      await agent.buildImage();
    }
    console.log();
  }

  #discover(): Agent[] {
    const entries = readdirSync(AGENTS_DIR, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => Agent.fromDir(e.name));
  }
}
