import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";
import type { CheckSlug } from "./generated/check-slugs";

type CheckFrontmatter = {
  label: string;
  description: string;
};

export class Check {
  readonly slug: CheckSlug;
  readonly position: number;
  readonly label: string;
  readonly description: string;
  readonly explanationMarkdown: string;

  constructor(opts: {
    slug: CheckSlug;
    position: number;
    label: string;
    description: string;
    explanationMarkdown: string;
  }) {
    this.slug = opts.slug;
    this.position = opts.position;
    this.label = opts.label;
    this.description = opts.description;
    this.explanationMarkdown = opts.explanationMarkdown;
  }

  static loadFromDir(dir: string): Check[] {
    const files = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .sort((a, b) => a.name.localeCompare(b.name));

    return files.map((file) => {
      const { position, slug } = parseFilename(file.name);
      const raw = readFileSync(resolve(dir, file.name), "utf-8");
      const { frontmatter, body } = parseFile(raw);
      return new Check({
        slug,
        position,
        label: frontmatter.label,
        description: frontmatter.description,
        explanationMarkdown: body,
      });
    });
  }
}

function parseFile(content: string): { frontmatter: CheckFrontmatter; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("No frontmatter found");
  }
  return {
    frontmatter: parseYaml(match[1]!) as CheckFrontmatter,
    body: match[2]!.trim(),
  };
}

function parseFilename(filename: string): { position: number; slug: CheckSlug } {
  const match = filename.match(/^(\d+)-(.+)\.md$/);
  if (!match) {
    throw new Error(`Check filename must start with a numeric position: ${filename}`);
  }

  return {
    position: Number(match[1]),
    slug: match[2] as CheckSlug,
  };
}
