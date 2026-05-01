import { resolve } from "node:path";
import { Check } from "./check";
import type { CheckSlug } from "./generated/check-slugs";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const CHECKS_DIR = resolve(PROJECT_ROOT, "checks");

export class CheckRegistry {
  readonly checks: Check[];

  constructor() {
    this.checks = Check.loadFromDir(CHECKS_DIR);
  }

  get checkSlugs(): CheckSlug[] {
    return this.checks.map((c) => c.slug);
  }

  checkBySlug(slug: CheckSlug): Check {
    const check = this.checks.find((c) => c.slug === slug);
    if (!check) {
      throw new Error(`Unknown check: ${slug}`);
    }
    return check;
  }
}
