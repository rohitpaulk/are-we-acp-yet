import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { CheckSlug } from "./generated/check-slugs";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const CHECKS_DIR = resolve(PROJECT_ROOT, "checks");

type CheckFrontmatter = {
  label: string;
  description: string;
};

export type CheckMetadata = {
  slug: CheckSlug;
  label: string;
  description: string;
};

function parseFrontmatter(content: string): CheckFrontmatter {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    throw new Error("No frontmatter found");
  }
  return parseYaml(match[1]) as CheckFrontmatter;
}

export function loadCheckMetadata(): Map<CheckSlug, CheckMetadata> {
  const map = new Map<CheckSlug, CheckMetadata>();

  const files = readdirSync(CHECKS_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".md"));

  for (const file of files) {
    const slug = file.name.replace(/\.md$/, "") as CheckSlug;
    const raw = readFileSync(resolve(CHECKS_DIR, file.name), "utf-8");
    const fm = parseFrontmatter(raw);
    map.set(slug, { slug, label: fm.label, description: fm.description });
  }

  return map;
}
