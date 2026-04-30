import { setDefaultTimeout, afterAll } from "bun:test";
import chalk from "chalk";

setDefaultTimeout(15_000);

await import("../scripts/generate-check-slugs");

const { AgentRegistry } = await import("../lib/agent-registry");
const { CheckCollectorRegistry } =
  await import("../lib/check-collector-registry");
const { writeResults } = await import("../lib/results-writer");

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

      const message = collector.checkMessages.get(check);
      console.log(
        `  ${collector.agent.slug}: ${status}${message ? ` — ${message}` : ""}`,
      );
    }
  }

  console.log("\n" + "=".repeat(60));

  writeResults(checkCollectorRegistry);
});
