import { Tooltip } from "@base-ui/react/tooltip";
import Balancer from "react-wrap-balancer";


interface Check {
  slug: string;
  label: string;
  description: string;
  status: string;
}

interface AgentCardProps {
  slug: string;
  name: string;
  company: string;
  checks: Check[];
}

function logoPath(slug: string) {
  const map: Record<string, string> = {
    "claude-code": "claude",
    codex: "openai",
  };
  return `/logos/${map[slug] ?? slug}.svg`;
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TooltipContent({
  check,
  agentSlug,
}: {
  check: Check;
  agentSlug: string;
}) {
  return (
    <>
      <div className="flex items-center gap-1.5 font-bold text-sm mb-2.5">
        <span className={`tooltip-icon ${check.status}`}>
          {check.status === "pass" ? (
            <CheckIcon size={12} />
          ) : (
            <XIcon size={12} />
          )}
        </span>
        {check.label}
      </div>
      <Balancer as="div" className="text-xs text-text-dim leading-snug">
        {check.description}
      </Balancer>
      <a
        href={`/${agentSlug}#check-${check.slug}`}
        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-text-muted no-underline transition-colors hover:text-text"
      >
        View details &rarr;
      </a>
    </>
  );
}

function CheckCell({
  check,
  agentSlug,
}: {
  check: Check;
  agentSlug: string;
}) {
  const statusLabel = check.status === "pass" ? "Passed" : "Failed";

  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <a
            href={`/${agentSlug}#check-${check.slug}`}
            aria-label={`${check.label}: ${statusLabel}`}
          />
        }
        closeOnClick={false}
        className="cell-anchor"
      >
        <span className={`cell ${check.status}`} aria-hidden="true">
          {check.status === "pass" ? <CheckIcon /> : <XIcon />}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8} className="tooltip-positioner">
          <Tooltip.Popup className="tooltip-popup">
            <TooltipContent check={check} agentSlug={agentSlug} />
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export default function AgentCard({
  slug,
  name,
  checks,
}: AgentCardProps) {
  const passed = checks.filter((c) => c.status === "pass").length;
  const pct = Math.round((passed / checks.length) * 100);

  return (
    <div className="relative bg-surface border border-border p-6 transition-colors hover:border-border-hover">
      <a
        href={`/${slug}`}
        aria-label={`View ${name} details`}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 flex items-center justify-between mb-5 pointer-events-none">
        <div>
          <h2 className="text-xl font-bold tracking-tight leading-tight">
            {name}
          </h2>
          <div className="text-xs text-text-muted mt-0.5">
            <span className="text-text-dim font-semibold">{pct}%</span> passed
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img
            src={logoPath(slug)}
            alt={name}
            className="w-8 h-8 brightness-0 invert opacity-70"
          />
        </div>
      </div>
      <Tooltip.Provider delay={0} closeDelay={150}>
        <div className="relative z-10 check-grid">
          {checks.map((check) => (
            <CheckCell key={check.slug} check={check} agentSlug={slug} />
          ))}
        </div>
      </Tooltip.Provider>
    </div>
  );
}
