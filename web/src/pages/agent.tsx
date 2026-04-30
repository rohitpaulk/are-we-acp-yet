import { useEffect } from "react";
import { useLocation } from "react-router";

import { CheckIcon } from "../components/CheckIcon";
import { XIcon } from "../components/XIcon";
import type { AgentCardProps as Agent, Check } from "../components/AgentCard";

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

  const sortedChecks = [...agent.checks].sort(
    (a, b) => a.position - b.position,
  );
  const passed = sortedChecks.filter((check) => check.status === "pass").length;
  const failed = sortedChecks.length - passed;

  return (
    <main className="pb-14">
      <div className="mb-5 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Checks</h2>
          <p className="mt-1 text-sm text-text-muted">
            {passed} of {sortedChecks.length} checks passed for {agent.name}.
          </p>
        </div>
        <div className="grid grid-cols-3 border border-border bg-surface text-center">
          <div className="px-4 py-2">
            <div className="text-lg font-bold text-text">
              {sortedChecks.length}
            </div>
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
        {sortedChecks.map((check) => {
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
                    {didPass ? <CheckIcon size={13} /> : <XIcon size={13} />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold tracking-tight text-text">
                      {check.label}
                    </span>
                    <span className="block truncate text-xs text-text-muted">
                      #{check.slug}
                    </span>
                  </span>
                </span>
                <span className="ml-auto flex shrink-0 items-center gap-3">
                  <span
                    className={`check-status-badge ${didPass ? "pass" : "fail"}`}
                  >
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
                    <div
                      className="check-explanation-markdown prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: check.explanation_markdown,
                      }}
                    />
                  </div>
                  <div
                    className={`check-detail-panel ${didPass ? "result-pass" : "result-fail"}`}
                  >
                    <div className="check-detail-label">
                      {didPass ? "Result" : "Failure message"}
                    </div>
                    <p>{check.message}</p>
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
