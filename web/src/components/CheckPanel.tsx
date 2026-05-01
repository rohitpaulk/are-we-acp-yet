import { useMemo } from "react";
import { marked } from "marked";
import clsx from "clsx";

import { CheckIcon } from "./CheckIcon";
import { ChevronIcon } from "./ChevronIcon";
import { XIcon } from "./XIcon";
import type { Check } from "./AgentCard";

const checkCardClass =
  "group/check-card scroll-mt-6 border border-border bg-surface transition-colors duration-120 ease hover:border-border-hover hover:bg-surface-hover open:border-border-hover open:bg-surface-hover target:border-text-muted";

const checkSummaryClass =
  "flex min-h-14 cursor-pointer list-none items-center gap-4 px-3.5 py-2.5 [&::-webkit-details-marker]:hidden";

const statusIconClass = (didPass: boolean) =>
  [
    "inline-flex h-6 w-6 shrink-0 items-center justify-center border-[1.5px]",
    didPass ? "border-green-border bg-green-bg text-green" : "border-red-border bg-red-bg text-red",
  ].join(" ");

const statusBadgeClass = (didPass: boolean) =>
  [
    "border px-2 py-1 text-[10px] font-bold leading-none tracking-[0.08em] uppercase",
    didPass ? "border-green-border bg-green-bg text-green" : "border-red-border bg-red-bg text-red",
  ].join(" ");

function ResultPanel({
  didPass,
  message,
  className,
}: {
  didPass: boolean;
  message: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "border border-border p-3.5",
        didPass ? "bg-green-bg border-green-border" : "bg-red-bg border-red-border",
        className,
      )}
    >
      <div className="mb-1.5 text-xs font-bold uppercase">
        {didPass && <span className="text-green">CHECK PASSED</span>}
        {!didPass && <span className="text-red">CHECK FAILED</span>}
      </div>

      <div className="prose prose-invert prose-sm">
        <p>{message}</p>
      </div>
    </div>
  );
}

export function CheckPanel({ check }: { check: Check }) {
  const didPass = check.status === "pass";
  const statusLabel = didPass ? "Passed" : "Failed";
  const explanationHtml = useMemo(
    () =>
      marked.parse(check.explanation_markdown, {
        async: false,
      }) as string,
    [check.explanation_markdown],
  );

  return (
    <details id={`check-${check.slug}`} name="check-accordion" className={checkCardClass}>
      <summary className={checkSummaryClass}>
        <span className="flex min-w-0 items-center gap-3">
          <span className={statusIconClass(didPass)} aria-hidden="true">
            {didPass ? <CheckIcon size={13} /> : <XIcon size={13} />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-text">
              {check.label}
            </span>
          </span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <span className={statusBadgeClass(didPass)}>{statusLabel}</span>
          <span className="text-text-muted transition-transform duration-120 ease group-open/check-card:rotate-180">
            <ChevronIcon />
          </span>
        </span>
      </summary>
      <div className="border-t border-border p-3.5">
        <ResultPanel didPass={didPass} message={check.message} className="mb-3.5" />

        <div className="border border-border bg-surface p-3.5">
          <div className="mb-1.5 text-xs font-bold text-text-muted uppercase">
            Check explanation
          </div>

          <div
            className="prose prose-invert prose-sm"
            dangerouslySetInnerHTML={{ __html: explanationHtml }}
          />
        </div>
      </div>
    </details>
  );
}
