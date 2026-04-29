import { spring } from "motion";
import { AnimateView } from "motion-plus/animate-view";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";

import AgentCard from "./components/AgentCard";
import StatusPill from "./components/StatusPill";
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

function QuestionHeadline({ agentName }: { agentName?: string }) {
  return (
    <h1 className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-5xl leading-none font-bold tracking-tighter text-text">
      <AnimateView
        name="acp-headline-prefix"
        transition={{ type: spring, bounce: 0, duration: 0.5 }}
      >
        <span>{agentName ? "Is" : "Are"}</span>
      </AnimateView>
      <AnimateView
        name="acp-headline-subject"
        transition={{ type: spring, bounce: 0, duration: 0.5 }}
      >
        <span
          className={
            agentName
              ? "text-green underline decoration-green-border decoration-2 underline-offset-4"
              : undefined
          }
        >
          {agentName ?? "we"}
        </span>
      </AnimateView>
      <AnimateView
        name="acp-headline-suffix"
        transition={{ type: spring, bounce: 0, duration: 0.5 }}
      >
        <span>ACP yet?</span>
      </AnimateView>
    </h1>
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
    <div className="mx-auto max-w-5xl px-7">
      <header className="pt-24 pb-12 text-center">
        <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
        <QuestionHeadline />
        <StatusPill />
        <p className="mt-8 text-base leading-relaxed text-text-muted">
          <span className="font-semibold text-green">Green</span> checks pass,{" "}
          <span className="font-semibold text-red">red</span> checks fail. <br />
          Hover to see details.
        </p>
        <div className="mt-8 flex items-center justify-center gap-2">
          <a
            href="https://agentclientprotocol.com/"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:border-border-hover hover:text-text"
          >
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.5 9a2.5 2.5 0 0 1 4.34 1.69c0 1.67-1.68 2.18-1.84 3.31" />
              <path d="M12 17h.01" />
            </svg>
            What's this?
          </a>
          <a
            href="https://github.com/rohitpaulk/acp-verifier"
            target="_blank"
            className="inline-flex items-center gap-1.5 border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted no-underline transition-colors hover:border-border-hover hover:text-text"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            View on GitHub &rarr;
          </a>
        </div>
      </header>

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
    </div>
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
    <div className="relative mx-auto max-w-5xl px-7">
      <Link
        to="/"
        className="absolute top-7 left-7 inline-flex items-center gap-1 text-xs font-semibold text-text-muted no-underline transition-colors hover:text-text"
      >
        &larr; All agents
      </Link>

      <header className="pt-24 pb-12 text-center">
        <Link to="/">
          <img src="/logos/acp.svg" alt="ACP" className="mb-5 inline-block h-10 opacity-70" />
        </Link>
        <QuestionHeadline agentName={agent.name} />
        <StatusPill />
      </header>

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
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
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
                    <div
                      className={`check-detail-panel ${didPass ? "result-pass" : "result-fail"}`}
                    >
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
    </div>
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
