import { Tooltip } from "@base-ui/react/tooltip";

export default function StatusPill() {
  return (
    <Tooltip.Provider delay={0}>
      <Tooltip.Root>
        <Tooltip.Trigger
          closeOnClick={false}
          className="mt-5 inline-flex cursor-help items-center gap-2 rounded-full border border-red-border bg-red-bg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red" />
          <span>Status: Not Ready</span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8}>
            <Tooltip.Popup className="tooltip-popup status-tooltip-popup">
              80% checks required to pass.
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
