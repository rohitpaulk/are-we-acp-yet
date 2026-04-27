import { CheckCollector } from "./check-collector";
import { AgentRegistry } from "./agent-registry";

export class CheckCollectorRegistry {
  readonly map: Map<string, CheckCollector>;

  constructor(agentRegistry: AgentRegistry) {
    this.map = new Map();

    for (const agent of agentRegistry.agents) {
      this.map.set(agent.slug, new CheckCollector(agent));
    }
  }

  get(slug: string): CheckCollector {
    const collector = this.map.get(slug);
    if (!collector) {
      throw new Error(`Unknown agent: ${slug}`);
    }
    return collector;
  }
}
