import { resolve } from "node:path";
import chalk from "chalk";
import { CheckCollector } from "./check-collector";
import { AgentRegistry } from "./agent-registry";
import { type CheckSlug } from "./generated/check-slugs";
import { CheckRegistry } from "./check-registry";
import { type AgentResult, ResultsFile } from "./results-file";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const CHECKS_DIR = resolve(PROJECT_ROOT, "checks");

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

  toResultsFile(): ResultsFile {
    const checkRegistry = CheckRegistry.loadFromDir(CHECKS_DIR);

    const agents = [...this.map.values()].flatMap((collector): AgentResult[] => {
      const checks = recordedCheckSlugs(collector).map((slug) => {
        const check = checkRegistry.checkBySlug(slug);

        const message = collector.checkMessages.get(slug);
        if (!message) {
          throw new Error(`No result message recorded for check: ${slug}`);
        }

        return {
          slug: check.slug,
          position: check.position,
          label: check.label,
          description: check.description,
          explanation_markdown: check.explanationMarkdown,
          status: checkStatus(collector, slug),
          message,
        };
      });

      if (checks.length === 0) {
        return [];
      }

      return [
        {
          slug: collector.agent.slug,
          name: collector.agent.name,
          company: collector.agent.company,
          version_string: collector.agent.versionString,
          checks,
        },
      ];
    });

    return new ResultsFile({
      lastUpdated: new Date().toISOString().slice(0, 10),
      agents,
    });
  }

  printResults(): void {
    const collectors = [...this.map.values()];
    const checkSlugs = new Set<CheckSlug>();

    for (const collector of collectors) {
      for (const slug of collector.collectedCheckSlugs()) {
        checkSlugs.add(slug);
      }
    }

    console.log("\n" + chalk.bold("Check Results"));
    console.log("=".repeat(60));

    for (const checkSlug of checkSlugs) {
      console.log(`\n${chalk.bold(checkSlug)}`);

      for (const collector of collectors) {
        let status: string;

        if (collector.passedCheckSlugs.has(checkSlug)) {
          status = chalk.green("PASS");
        } else if (collector.failedCheckSlugs.has(checkSlug)) {
          status = chalk.red("FAIL");
        } else {
          status = chalk.gray("SKIP");
        }

        const message = collector.checkMessages.get(checkSlug);
        console.log(`  ${collector.agent.slug}: ${status}${message ? ` — ${message}` : ""}`);
      }
    }

    console.log("\n" + "=".repeat(60));
  }
}

function recordedCheckSlugs(collector: CheckCollector): CheckSlug[] {
  return [...collector.checkSlugs].filter(
    (slug) => collector.passedCheckSlugs.has(slug) || collector.failedCheckSlugs.has(slug),
  );
}

function checkStatus(collector: CheckCollector, slug: CheckSlug): "pass" | "fail" {
  if (collector.passedCheckSlugs.has(slug)) {
    return "pass";
  }

  if (collector.failedCheckSlugs.has(slug)) {
    return "fail";
  }

  throw new Error(`Check ${slug} was not run for agent ${collector.agent.slug}`);
}
