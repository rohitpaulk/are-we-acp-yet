import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { Check } from "./check";
import type { CheckSlug } from "./generated/check-slugs";

export class CheckRegistry {
  readonly checks: Check[];

  constructor(checks: Check[]) {
    this.checks = checks;
  }

  static loadFromDir(dir: string): CheckRegistry {
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .sort((a, b) => a.name.localeCompare(b.name));

    const checks = files.map((file) => Check.loadFromFile(resolve(dir, file.name)));
    return new CheckRegistry(checks);
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
