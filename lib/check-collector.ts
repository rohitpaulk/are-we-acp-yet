import { resolve } from "node:path";
import { readdirSync } from "fs";
import type { Agent } from "./agent";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const CHECKS_DIR = resolve(PROJECT_ROOT, "checks");

export class CheckCollector {
  readonly agent: Agent;
  readonly checkSlugs: Set<string>;
  readonly passedCheckSlugs: Set<string>;
  readonly failedCheckSlugs: Set<string>;

  constructor(agent: Agent) {
    this.agent = agent;
    this.checkSlugs = this.discoverCheckSlugs();
    this.passedCheckSlugs = new Set();
    this.failedCheckSlugs = new Set();
  }

  pass(slug: string): void {
    if (!this.checkSlugs.has(slug)) {
      throw new Error(`Unknown check: ${slug}`);
    }

    if (this.failedCheckSlugs.has(slug)) {
      throw new Error(`Failed check ${slug} cannot be marked as passed`);
    }

    if (this.passedCheckSlugs.has(slug)) {
      throw new Error(`${slug} already passed`);
    }

    this.passedCheckSlugs.add(slug);
  }

  fail(slug: string): void {
    if (!this.checkSlugs.has(slug)) {
      throw new Error(`Unknown check: ${slug}`);
    }

    if (this.passedCheckSlugs.has(slug)) {
      throw new Error(`Passed check ${slug} cannot be marked as failed`);
    }

    if (this.failedCheckSlugs.has(slug)) {
      throw new Error(`Check already failed: ${slug}`);
    }

    this.failedCheckSlugs.add(slug);
  }

  private discoverCheckSlugs(): Set<string> {
    const entries = readdirSync(CHECKS_DIR, { withFileTypes: true });

    const setSlugs = entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name.replace(/\.md$/, ""));

    return new Set(setSlugs);
  }
}
