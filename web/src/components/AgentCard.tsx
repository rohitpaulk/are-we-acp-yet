import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Link } from "react-router";
import Balancer from "react-wrap-balancer";

import { CheckIcon } from "./CheckIcon";
import CursorGlowCard from "./CursorGlowCard";
import { XIcon } from "./XIcon";

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

function PopoverContent({
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
  handle,
}: {
  check: Check;
  agentSlug: string;
  handle: Popover.Handle<Check>;
}) {
  const statusLabel = check.status === "pass" ? "Passed" : "Failed";

  return (
    <div className="cell-anchor-wrapper">
      <Popover.Trigger
        handle={handle}
        payload={check}
        openOnHover
        delay={0}
        closeDelay={120}
        render={
          <Link
            to={`/${agentSlug}#check-${check.slug}`}
            aria-label={`${check.label}: ${statusLabel}`}
            className="cell-anchor cursor-pointer"
          />
        }
      >
        <span className={`cell ${check.status}`} aria-hidden="true">
          {check.status === "pass" ? <CheckIcon /> : <XIcon />}
        </span>
      </Popover.Trigger>
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

  const popoverHandleRef = useRef<Popover.Handle<Check> | null>(null);
  if (!popoverHandleRef.current) popoverHandleRef.current = Popover.createHandle<Check>();
  const popoverHandle = popoverHandleRef.current;
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const lastPayloadRef = useRef<Check | null>(null);

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
          <CheckCell
            key={check.slug}
            check={check}
            agentSlug={slug}
            handle={popoverHandle}
          />
        ))}
      </div>
      <Popover.Root
        handle={popoverHandle}
        onOpenChange={(open, eventDetails) => {
          if (open && eventDetails.trigger) {
            setAnchorEl(eventDetails.trigger);
          }
        }}
      >
        {({ payload }) => {
          if (payload) {
            lastPayloadRef.current = payload;
          }
          const check = payload ?? lastPayloadRef.current;

          return (
            <Popover.Portal keepMounted>
              <Popover.Positioner
                className="tooltip-positioner"
                anchor={anchorEl}
                side="top"
                sideOffset={8}
                collisionPadding={12}
              >
                <Popover.Popup className="tooltip-popup cell-tooltip">
                  {check && (
                    <PopoverContent check={check} agentSlug={slug} />
                  )}
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          );
        }}
      </Popover.Root>
    </CursorGlowCard>
  );
}
