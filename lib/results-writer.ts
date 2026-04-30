import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { marked } from "marked";
import type { CheckCollectorRegistry } from "./check-collector-registry";
import { loadCheckMetadata } from "./check-metadata";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const OUTPUT_PATH = resolve(PROJECT_ROOT, "web/data/results.json");

export function writeResults(collectorRegistry: CheckCollectorRegistry): void {
  const checkMetadata = loadCheckMetadata();

  const agents = [...collectorRegistry.map.values()].map((collector) => {
    const checks = [...collector.checkSlugs].map((slug) => {
      const meta = checkMetadata.get(slug);
      if (!meta) {
        throw new Error(`No metadata found for check: ${slug}`);
      }

      let status: "pass" | "fail";
      if (collector.passedCheckSlugs.has(slug)) {
        status = "pass";
      } else {
        status = "fail";
      }

      const message = collector.checkMessages.get(slug);
      if (!message) {
        throw new Error(`No result message recorded for check: ${slug}`);
      }

      return {
        slug: meta.slug,
        position: meta.position,
        label: meta.label,
        description: meta.description,
        explanation_markdown: marked.parse(meta.explanationMarkdown, {
          async: false,
        }) as string,
        status,
        message,
      };
    });

    return {
      slug: collector.agent.slug,
      name: collector.agent.name,
      company: collector.agent.company,
      version_string: collector.agent.versionString,
      checks,
    };
  });

  const results = {
    lastUpdated: new Date().toISOString().slice(0, 10),
    agents,
  };

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2) + "\n");

  console.log(`\nWrote results to ${OUTPUT_PATH}`);
}
