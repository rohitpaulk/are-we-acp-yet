import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Link } from "react-router";

import Button from "./Button";
import { CheckIcon } from "./CheckIcon";
import CursorGlowCard from "./CursorGlowCard";
import { XIcon } from "./XIcon";

export interface Check {
  slug: string;
  position: number;
  label: string;
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

const tooltipIconClass = (status: string) =>
  [
    "inline-flex h-5 w-5 shrink-0 items-center justify-center border-[1.5px]",
    status === "pass"
      ? "border-green-border bg-green-bg text-green"
      : "border-red-border bg-red-bg text-red",
  ].join(" ");

const tooltipPositionerClass =
  "z-50 h-[var(--positioner-height)] w-[var(--positioner-width)] transition-[top,left,right,bottom] duration-150 ease data-[instant]:duration-0";

const tooltipPopupClass =
  "z-50 max-w-[280px] border border-tooltip-border bg-tooltip-bg px-4 py-3.5 text-left text-[0.85rem] font-medium text-text shadow-[0_8px_24px_rgba(0,0,0,0.5)] [--tooltip-fade-duration:120ms]";

const cellTooltipClass =
  "w-max origin-[var(--transform-origin)] opacity-100 transition-[opacity,transform] duration-[var(--tooltip-fade-duration)] ease data-[ending-style]:scale-[0.96] data-[ending-style]:opacity-0 data-[instant]:duration-0 data-[starting-style]:scale-[0.96] data-[starting-style]:opacity-0";

const cellTooltipViewportClass =
  "[&>[data-current]]:opacity-100 [&>[data-current]]:transition-opacity [&>[data-current]]:duration-[120ms] [&>[data-previous]]:hidden data-[instant]:[&>[data-current]]:duration-0";

const checkCellWrapperClass =
  "group/cell relative aspect-square w-full hover:z-10 focus-within:z-10 has-[[data-cell-anchor][data-popup-open]]:z-10";

const checkCellAnchorClass =
  "relative flex aspect-square h-full w-full cursor-pointer appearance-none items-center justify-center border-0 bg-transparent p-0 font-inherit";

const checkCellClass = (status: string) =>
  [
    "flex h-full w-full items-center justify-center transition-[transform,box-shadow] duration-[120ms] ease group-hover/cell:scale-125 group-focus-within/cell:scale-125 group-has-[[data-cell-anchor][data-popup-open]]/cell:scale-125",
    status === "pass"
      ? "border-[1.5px] border-green-border bg-[color-mix(in_srgb,var(--color-green)_12%,var(--color-surface))] text-green group-hover/cell:bg-[color-mix(in_srgb,var(--color-green)_20%,var(--color-surface))] group-hover/cell:shadow-[0_0_12px_rgba(45,212,104,0.15)] group-focus-within/cell:bg-[color-mix(in_srgb,var(--color-green)_20%,var(--color-surface))] group-focus-within/cell:shadow-[0_0_12px_rgba(45,212,104,0.15)] group-has-[[data-cell-anchor][data-popup-open]]/cell:bg-[color-mix(in_srgb,var(--color-green)_20%,var(--color-surface))] group-has-[[data-cell-anchor][data-popup-open]]/cell:shadow-[0_0_12px_rgba(45,212,104,0.15)]"
      : "border-[1.5px] border-red-border bg-[color-mix(in_srgb,var(--color-red)_12%,var(--color-surface))] text-red group-hover/cell:bg-[color-mix(in_srgb,var(--color-red)_20%,var(--color-surface))] group-hover/cell:shadow-[0_0_12px_rgba(240,72,72,0.15)] group-focus-within/cell:bg-[color-mix(in_srgb,var(--color-red)_20%,var(--color-surface))] group-focus-within/cell:shadow-[0_0_12px_rgba(240,72,72,0.15)] group-has-[[data-cell-anchor][data-popup-open]]/cell:bg-[color-mix(in_srgb,var(--color-red)_20%,var(--color-surface))] group-has-[[data-cell-anchor][data-popup-open]]/cell:shadow-[0_0_12px_rgba(240,72,72,0.15)]",
  ].join(" ");

function PopoverContent({ check, agentSlug }: { check: Check; agentSlug: string }) {
  return (
    <>
      <div className="flex items-center gap-1.5 font-bold text-sm mb-2.5">
        <span className={tooltipIconClass(check.status)}>
          {check.status === "pass" ? <CheckIcon size={12} /> : <XIcon size={12} />}
        </span>
        {check.label}
      </div>
      <div className="text-xs text-text-dim leading-snug overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
        {check.message}
      </div>
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
    <div className={checkCellWrapperClass} data-cell-wrapper="">
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
            data-cell-anchor=""
            className={checkCellAnchorClass}
          />
        }
      >
        <span className={checkCellClass(check.status)} aria-hidden="true">
          {check.status === "pass" ? <CheckIcon /> : <XIcon />}
        </span>
      </Popover.Trigger>
    </div>
  );
}

export default function AgentCard({ slug, name, company, version_string, checks }: AgentCardProps) {
  const sortedChecks = [...checks].sort((a, b) => a.position - b.position);
  const passed = sortedChecks.filter((c) => c.status === "pass").length;
  const pct = Math.round((passed / sortedChecks.length) * 100);
  const logo = logoPath(slug);

  const popoverHandleRef = useRef<Popover.Handle<Check> | null>(null);
  if (!popoverHandleRef.current) popoverHandleRef.current = Popover.createHandle<Check>();
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
            <h2 className="text-xl font-bold tracking-tight leading-tight">{name}</h2>
            <div className="text-xs text-text-muted mt-0.5">by {company}</div>
          </div>
        </div>
        <div className="border border-white/5 px-1 py-0.5">
          <div className="text-xs text-text-muted">{version_string}</div>
        </div>
      </div>
      <div className="relative z-10 grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1">
        {sortedChecks.map((check) => (
          <CheckCell key={check.slug} check={check} agentSlug={slug} handle={popoverHandle} />
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
                className={tooltipPositionerClass}
                anchor={anchorEl}
                side="top"
                sideOffset={8}
                collisionPadding={12}
              >
                <Popover.Popup className={`${tooltipPopupClass} ${cellTooltipClass}`}>
                  <Popover.Viewport className={cellTooltipViewportClass}>
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
