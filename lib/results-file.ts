import { existsSync, readFileSync } from "node:fs";
import { marked } from "marked";
import type { CheckCollector } from "./check-collector";
import type { CheckCollectorRegistry } from "./check-collector-registry";
import type { CheckSlug } from "./generated/check-slugs";
import { loadCheckMetadata } from "./check-metadata";

export type CheckResult = {
  slug: string;
  position: number;
  label: string;
  description: string;
  explanation_markdown: string;
  status: "pass" | "fail";
  message: string;
};

export type AgentResult = {
  slug: string;
  name: string;
  company: string;
  version_string: string;
  checks: CheckResult[];
};

type ResultsFileJSON = {
  lastUpdated?: string;
  agents?: AgentResult[];
};

export class ResultsFile {
  readonly lastUpdated: string;
  readonly agents: AgentResult[];

  constructor({ lastUpdated, agents }: { lastUpdated: string; agents: AgentResult[] }) {
    this.lastUpdated = lastUpdated;
    this.agents = agents;
  }

  static fromFile(path: string): ResultsFile {
    if (!existsSync(path)) {
      return ResultsFile.empty();
    }

    const parsed = JSON.parse(readFileSync(path, "utf-8")) as ResultsFileJSON;

    return new ResultsFile({
      lastUpdated: parsed.lastUpdated ?? "",
      agents: parsed.agents ?? [],
    });
  }

  static fromCheckCollectorRegistry(collectorRegistry: CheckCollectorRegistry): ResultsFile {
    const checkMetadata = loadCheckMetadata();

    const agents = [...collectorRegistry.map.values()].flatMap((collector) => {
      const checks = recordedCheckSlugs(collector).map((slug) => {
        const meta = checkMetadata.get(slug);
        if (!meta) {
          throw new Error(`No metadata found for check: ${slug}`);
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
      lastUpdated: today(),
      agents,
    });
  }

  merge(partial: ResultsFile): ResultsFile {
    const agentsBySlug = new Map(this.agents.map((agent) => [agent.slug, agent]));

    for (const partialAgent of partial.agents) {
      const existingAgent = agentsBySlug.get(partialAgent.slug);

      agentsBySlug.set(partialAgent.slug, {
        ...existingAgent,
        slug: partialAgent.slug,
        name: partialAgent.name,
        company: partialAgent.company,
        version_string: partialAgent.version_string,
        checks: mergeChecks(existingAgent?.checks ?? [], partialAgent.checks),
      });
    }

    return new ResultsFile({
      lastUpdated: today(),
      agents: [...agentsBySlug.values()],
    });
  }

  private static empty(): ResultsFile {
    return new ResultsFile({ lastUpdated: "", agents: [] });
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

function mergeChecks(existingChecks: CheckResult[], partialChecks: CheckResult[]): CheckResult[] {
  const checksBySlug = new Map(existingChecks.map((check) => [check.slug, check]));

  for (const check of partialChecks) {
    checksBySlug.set(check.slug, check);
  }

  return [...checksBySlug.values()].sort((a, b) => a.position - b.position);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
