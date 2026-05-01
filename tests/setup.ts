import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { setDefaultTimeout, afterAll } from "bun:test";

setDefaultTimeout(15_000);

await import("../scripts/generate-check-slugs");

const { AgentRegistry } = await import("../lib/agent-registry");
const { CheckCollectorRegistry } = await import("../lib/check-collector-registry");
const { ResultsFile } = await import("../lib/results-file");

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const OUTPUT_PATH = resolve(PROJECT_ROOT, "web/data/results.json");

export const registry = new AgentRegistry();
await registry.buildAllImages();

export const checkCollectorRegistry = new CheckCollectorRegistry(registry);

afterAll(() => {
  checkCollectorRegistry.printResults();

  const existingResults = ResultsFile.fromFile(OUTPUT_PATH);
  const partialResults = ResultsFile.fromCheckCollectorRegistry(checkCollectorRegistry);
  const results = existingResults.merge(partialResults);

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2) + "\n");

  console.log(`\nWrote results to ${OUTPUT_PATH}`);
});
