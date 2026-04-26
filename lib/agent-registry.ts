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

  private discover(): Agent[] {
    const entries = readdirSync(AGENTS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => Agent.fromDir(e.name));
  }

  buildAllImages(): void {
    for (const agent of this.agents) {
      agent.buildImage();
    }
  }
}
