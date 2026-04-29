import { useEffect } from "react";
import { Link, useLocation } from "react-router";

import AgentCard from "./components/AgentCard";
import { CheckIcon } from "./components/CheckIcon";
import { XIcon } from "./components/XIcon";
import mockData from "./data/mock-results.json";

export type Agent = (typeof mockData.agents)[number];
type Check = Agent["checks"][number];

const failureMessages: Record<string, Record<string, string>> = {
  codex: {
    "supports-session-resume":
      "Codex returned a new session instead of restoring the previous session state.",
    "http-transport": "Codex did not expose a streamable HTTP ACP endpoint during verification.",
    "tool-call-streaming":
      "Codex buffered tool output until completion instead of sending incremental updates.",
    "tool-call-cancellation":
      "Codex accepted the cancellation request, but the running tool continued to completion.",
    "tool-call-progress":
      "Codex completed the long-running tool without sending progress notifications.",
    "resource-subscribe":
      "Codex listed resources, but did not emit update events after a subscription was opened.",
    "resource-templates":
      "Codex did not advertise parameterized resource templates in its capabilities.",
    "prompt-arguments":
      "Codex returned the prompt, but did not validate or apply the supplied arguments.",
    "sampling-basic": "Codex did not issue a sampling request back through the ACP client.",
  },
  copilot: {
    "supports-session-close":
      "Copilot did not acknowledge session close with the expected cleanup response.",
    "supports-session-resume":
      "Copilot started a fresh session when asked to resume a previously created one.",
    "init-protocol-version":
      "Copilot did not negotiate the requested protocol version during initialization.",
    "tool-call-error": "Copilot returned an unstructured failure for an invalid tool call.",
    "tool-call-cancellation":
      "Copilot left the in-flight tool running after the verifier sent cancellation.",
    "resource-list": "Copilot did not return resource metadata in the expected ACP response shape.",
    "resource-read":
      "Copilot could not read back the resource URI returned by the verifier fixture.",
    "resource-subscribe":
      "Copilot did not keep a resource subscription open for update notifications.",
    "resource-templates": "Copilot did not expose any resource URI templates to the client.",
    "prompt-list":
      "Copilot did not return prompt definitions with names, descriptions, and arguments.",
    "prompt-get": "Copilot could not render the requested prompt into model-ready messages.",
    "prompt-arguments": "Copilot ignored required prompt arguments instead of validating them.",
    "log-levels": "Copilot emitted logs, but did not honor the requested severity filter.",
    "sampling-basic": "Copilot did not call back to the client with a sampling request.",
  },
  "claude-code": {
    "tool-call-cancellation":
      "Claude Code acknowledged cancellation, but the verifier still observed tool output afterward.",
    "resource-templates":
      "Claude Code supports direct resources, but did not advertise URI template support.",
  },
};

function formatHumanDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const suffix = day >= 11 && day <= 13 ? "th" : (["th", "st", "nd", "rd"][day % 10] ?? "th");

  return `${day}${suffix} ${date.toLocaleString("en", {
    month: "long",
  })} ${year}`;
}

function resultMessage(agent: Agent, check: Check) {
  if (check.status === "pass") {
    return `${agent.name} passed this check in the latest verifier run.`;
  }

  return (
    failureMessages[agent.slug]?.[check.slug] ??
    `${agent.name} failed this check in the latest verifier run.`
  );
}

export function HomePage() {
  const agents = [...mockData.agents].sort((a, b) => {
    const pctA = a.checks.filter((check) => check.status === "pass").length / a.checks.length;
    const pctB = b.checks.filter((check) => check.status === "pass").length / b.checks.length;
    return pctB - pctA;
  });
  const lastUpdated = formatHumanDate(mockData.lastUpdated);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.slug} {...agent} />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-border pt-5 pb-10 text-xs text-text-muted">
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
          How are these checks determined? &rarr;
        </a>
      </div>
    </>
  );
}

export function AgentPage({ agent }: { agent: Agent }) {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      return;
    }

    const target = document.querySelector(hash);
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
    }
  }, [agent.slug, hash]);

  const passed = agent.checks.filter((check) => check.status === "pass").length;
  const failed = agent.checks.length - passed;

  return (
    <main className="pb-14">
      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Checks</h2>
          <p className="mt-1 text-sm text-text-muted">
            {passed} of {agent.checks.length} checks passed for {agent.name}.
          </p>
        </div>
        <div className="grid grid-cols-3 border border-border bg-surface text-center">
          <div className="px-4 py-2">
            <div className="text-lg font-bold text-text">{agent.checks.length}</div>
            <div className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              Total
            </div>
          </div>
          <div className="border-l border-border px-4 py-2">
            <div className="text-lg font-bold text-green">{passed}</div>
            <div className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              Passed
            </div>
          </div>
          <div className="border-l border-border px-4 py-2">
            <div className="text-lg font-bold text-red">{failed}</div>
            <div className="text-[10px] font-semibold tracking-wide text-text-muted uppercase">
              Failed
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {agent.checks.map((check) => {
          const didPass = check.status === "pass";
          const statusLabel = didPass ? "Passed" : "Failed";

          return (
            <details
              key={check.slug}
              id={`check-${check.slug}`}
              className={`check-card ${didPass ? "check-card-pass" : "check-card-fail"}`}
            >
              <summary className="check-summary">
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`check-status-icon ${didPass ? "pass" : "fail"}`}
                    aria-hidden="true"
                  >
                    {didPass ? (
                      <CheckIcon size={13} />
                    ) : (
                      <XIcon size={13} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold tracking-tight text-text">
                      {check.label}
                    </span>
                    <span className="block truncate text-xs text-text-muted">#{check.slug}</span>
                  </span>
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-3">
                  <span className={`check-status-badge ${didPass ? "pass" : "fail"}`}>
                    {statusLabel}
                  </span>
                  <svg
                    className="check-chevron text-text-muted"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </span>
              </summary>
              <div className="check-body">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="check-detail-panel">
                    <div className="check-detail-label">Check explanation</div>
                    <p>{check.description}</p>
                  </div>
                  <div className={`check-detail-panel ${didPass ? "result-pass" : "result-fail"}`}>
                    <div className="check-detail-label">
                      {didPass ? "Result" : "Failure message"}
                    </div>
                    <p>{resultMessage(agent, check)}</p>
                  </div>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}

export function NotFoundPage({ slug }: { slug: string }) {
  return (
    <div className="mx-auto max-w-5xl px-7">
      <main className="pt-24 pb-14 text-center">
        <Link to="/">
          <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
        </Link>
        <h1 className="text-5xl leading-none font-bold tracking-tighter text-text">
          Agent not found
        </h1>
        <p className="mt-6 text-text-muted">
          No ACP verifier results exist for <span className="text-text-dim">{slug}</span>.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:border-border-hover hover:text-text"
        >
          &larr; All agents
        </Link>
      </main>
    </div>
  );
}
