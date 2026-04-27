import type { Agent } from "./agent";
import { CHECK_SLUGS, type CheckSlug } from "./generated/check-slugs";

export class CheckCollector {
  readonly agent: Agent;
  readonly checkSlugs: Set<CheckSlug>;
  readonly passedCheckSlugs: Set<CheckSlug>;
  readonly failedCheckSlugs: Set<CheckSlug>;

  constructor(agent: Agent) {
    this.agent = agent;
    this.checkSlugs = new Set(CHECK_SLUGS);
    this.passedCheckSlugs = new Set();
    this.failedCheckSlugs = new Set();
  }

  pass(slug: CheckSlug): void {
    if (this.failedCheckSlugs.has(slug)) {
      throw new Error(`Failed check ${slug} cannot be marked as passed`);
    }

    if (this.passedCheckSlugs.has(slug)) {
      throw new Error(`${slug} already passed`);
    }

    this.passedCheckSlugs.add(slug);
  }

  fail(slug: CheckSlug): void {
    if (this.passedCheckSlugs.has(slug)) {
      throw new Error(`Passed check ${slug} cannot be marked as failed`);
    }

    if (this.failedCheckSlugs.has(slug)) {
      throw new Error(`Check already failed: ${slug}`);
    }

    this.failedCheckSlugs.add(slug);
  }
}
