import { Link } from "react-router";
import Balancer from "react-wrap-balancer";

import CursorGlowCard from "./CursorGlowCard";

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
      <Link
        to={`/${agentSlug}#check-${check.slug}`}
        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-text-muted no-underline transition-colors hover:text-text"
      >
        View details &rarr;
      </Link>
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
    <div className="cell-anchor-wrapper">
      <Link
        to={`/${agentSlug}#check-${check.slug}`}
        aria-label={`${check.label}: ${statusLabel}`}
        className="cell-anchor cursor-pointer"
      >
        <span className={`cell ${check.status}`} aria-hidden="true">
          {check.status === "pass" ? <CheckIcon /> : <XIcon />}
        </span>
      </Link>
      <div className="tooltip-popup cell-tooltip">
        <TooltipContent check={check} agentSlug={agentSlug} />
      </div>
    </div>
  );
}

export default function AgentCard({
  slug,
  name,
  checks,
}: AgentCardProps) {
  const passed = checks.filter((c) => c.status === "pass").length;
  const pct = Math.round((passed / checks.length) * 100);
  const logo = logoPath(slug);

  return (
    <CursorGlowCard className="group relative p-6" glowImageSrc={logo}>
      <Link
        to={`/${slug}`}
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
            src={logo}
            alt={name}
            className="w-8 h-8 grayscale opacity-50 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100"
          />
        </div>
      </div>
      <div className="relative z-10 check-grid">
        {checks.map((check) => (
          <CheckCell key={check.slug} check={check} agentSlug={slug} />
        ))}
      </div>
    </CursorGlowCard>
  );
}
