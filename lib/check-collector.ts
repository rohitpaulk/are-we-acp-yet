import type { Agent } from "./agent";
import { CHECK_SLUGS, type CheckSlug } from "./generated/check-slugs";

export class CheckCollector {
  readonly agent: Agent;
  readonly checkSlugs: Set<CheckSlug>;
  readonly passedCheckSlugs: Set<CheckSlug>;
  readonly failedCheckSlugs: Set<CheckSlug>;
  readonly checkMessages: Map<CheckSlug, string>;

  constructor(agent: Agent) {
    this.agent = agent;
    this.checkSlugs = new Set(CHECK_SLUGS);
    this.passedCheckSlugs = new Set();
    this.failedCheckSlugs = new Set();
    this.checkMessages = new Map();
  }

  pass(slug: CheckSlug, message: string): void {
    if (this.failedCheckSlugs.has(slug)) {
      throw new Error(`Failed check ${slug} cannot be marked as passed`);
    }

    if (this.passedCheckSlugs.has(slug)) {
      throw new Error(`${slug} already passed`);
    }

    this.passedCheckSlugs.add(slug);
    this.setMessage(slug, message);
  }

  fail(slug: CheckSlug, message: string): void {
    if (this.passedCheckSlugs.has(slug)) {
      throw new Error(`Passed check ${slug} cannot be marked as failed`);
    }

    if (this.failedCheckSlugs.has(slug)) {
      throw new Error(`Check already failed: ${slug}`);
    }

    this.failedCheckSlugs.add(slug);
    this.setMessage(slug, message);
  }

  private setMessage(slug: CheckSlug, message: string): void {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      throw new Error(`Check ${slug} requires a non-empty result message`);
    }

    this.checkMessages.set(slug, trimmedMessage);
  }
}
