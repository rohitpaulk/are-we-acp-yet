import { format, parseISO } from "date-fns";
import AgentCard, { type AgentCardProps } from "../components/AgentCard";
import resultsData from "../../data/results.json";
import { ResultsFile } from "../results-file";

const results = ResultsFile.fromJSON(resultsData);

// Hide these for now until their checks are better quality
const HIDDEN_AGENT_SLUGS = ["docker-agent"];

export function HomePage() {
  const agents = [...(results.agents as AgentCardProps[])]
    .sort((a, b) => {
      const pctA = a.checks.filter((check) => check.status === "pass").length / a.checks.length;
      const pctB = b.checks.filter((check) => check.status === "pass").length / b.checks.length;
      return pctB - pctA;
    })
    .filter((agent) => !HIDDEN_AGENT_SLUGS.includes(agent.slug));

  const lastUpdated = format(parseISO(results.lastUpdated), "do MMMM yyyy");

  return (
    <>
      <p className="mb-8 text-base leading-relaxed text-text-muted text-center">
        <span className="font-semibold text-green">Green</span> checks pass.{" "}
        <span className="font-semibold text-red">Red</span> checks fail. <br />
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.slug} {...agent} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5 pb-10 text-xs text-text-muted">
        <div className="flex items-center gap-4">
          <span>
            Last updated: <span className="text-text-dim">{lastUpdated}</span>
          </span>
        </div>
        <a
          href="https://github.com/rohitpaulk/acp-verifier"
          target="_blank"
          className="text-text-muted no-underline transition-colors hover:text-text"
        >
          View on GitHub &rarr;
        </a>
      </div>
    </>
  );
}
