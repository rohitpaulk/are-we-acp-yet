import { setDefaultTimeout, afterAll } from "bun:test";
import chalk from "chalk";
import { AgentRegistry } from "../lib/agent-registry";
import { CheckCollectorRegistry } from "../lib/check-collector-registry";
import { writeResults } from "../lib/results-writer";

setDefaultTimeout(15_000);

export const registry = new AgentRegistry();
await registry.buildAllImages();

export const checkCollectorRegistry = new CheckCollectorRegistry(registry);

afterAll(() => {
  const collectors = [...checkCollectorRegistry.map.values()];
  if (collectors.length === 0) return;

  const first = collectors[0];
  if (!first) return;
  const allChecks = [...first.checkSlugs];

  console.log("\n" + chalk.bold("Check Results"));
  console.log("=".repeat(60));

  for (const check of allChecks) {
    console.log(`\n${chalk.bold(check)}`);

    for (const collector of collectors) {
      let status: string;
      if (collector.passedCheckSlugs.has(check)) {
        status = chalk.green("PASS");
      } else if (collector.failedCheckSlugs.has(check)) {
        status = chalk.red("FAIL");
      } else {
        status = chalk.gray("SKIP");
      }
      console.log(`  ${collector.agent.slug}: ${status}`);
    }
  }

  console.log("\n" + "=".repeat(60));

  writeResults(checkCollectorRegistry);
});

