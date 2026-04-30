import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Link } from "react-router";
import Balancer from "react-wrap-balancer";

import Button from "./Button";
import { CheckIcon } from "./CheckIcon";
import CursorGlowCard from "./CursorGlowCard";
import { XIcon } from "./XIcon";

export interface Check {
  slug: string;
  position: number;
  label: string;
  description: string;
  explanation_markdown: string;
  status: string;
  message: string;
}

export interface AgentCardProps {
  slug: string;
  name: string;
  company: string;
  version_string: string;
  checks: Check[];
}

function logoPath(slug: string) {
  return `/logos/${slug}.svg`;
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
  company,
  version_string,
  checks,
}: AgentCardProps) {
  const sortedChecks = [...checks].sort((a, b) => a.position - b.position);
  const passed = sortedChecks.filter((c) => c.status === "pass").length;
  const pct = Math.round((passed / sortedChecks.length) * 100);
  const logo = logoPath(slug);

  const popoverHandleRef = useRef<Popover.Handle<Check> | null>(null);
  if (!popoverHandleRef.current)
    popoverHandleRef.current = Popover.createHandle<Check>();
  const popoverHandle = popoverHandleRef.current;
  const [anchorEl, setAnchorEl] = useState<Element | null>(null);
  const lastPayloadRef = useRef<Check | null>(null);

  return (
    <CursorGlowCard className="group relative p-6 pb-5" glowImageSrc={logo}>
      <Link
        to={`/${slug}`}
        prefetch="render"
        aria-label={`View ${name} details`}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10 flex items-center justify-between mb-5 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img
              src={logo}
              alt={name}
              className="w-8 h-8 grayscale opacity-50 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight leading-tight">
              {name}
            </h2>
            <div className="text-xs text-text-muted mt-0.5">by {company}</div>
          </div>
        </div>
        <div className="border border-white/5 px-1 py-0.5">
          <div className="text-xs text-text-muted">{version_string}</div>
        </div>
      </div>
      <div className="relative z-10 check-grid">
        {sortedChecks.map((check) => (
          <CheckCell
            key={check.slug}
            check={check}
            agentSlug={slug}
            handle={popoverHandle}
          />
        ))}
      </div>
      <div className="relative z-10 border-t border-white/5 mt-3 pt-2.5 flex items-center justify-between">
        <div>
          <div className="text-xs text-text-muted">PASS RATE</div>
          <div className="font-semibold text-lg">{pct}%</div>
        </div>
        <Button href={`/${slug}`}>View details &rarr;</Button>
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
                  <Popover.Viewport className="cell-tooltip-viewport">
                    {check && <PopoverContent check={check} agentSlug={slug} />}
                  </Popover.Viewport>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          );
        }}
      </Popover.Root>
    </CursorGlowCard>
  );
}
