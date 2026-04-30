import { Tooltip } from "@base-ui/react/tooltip";
import { Typewriter } from "motion-plus/react";
import { useLocation } from "react-router";

export default function StatusPill() {
  const location = useLocation();

  return (
    <Tooltip.Provider delay={0} closeDelay={120} timeout={400}>
      <Tooltip.Root>
        <span className="status-tooltip-root">
          <Tooltip.Trigger
            render={
              <span
                className="mt-5 inline-flex cursor-help items-center gap-2 border border-red-border bg-red-bg px-3 py-1.5 text-xs font-semibold tracking-wide text-red uppercase"
                tabIndex={0}
              />
            }
          >
            <span className="h-1.5 w-1.5 bg-red" />
            <span>Status: <Typewriter key={location.pathname} speed="slow" cursorBlinkRepeat={1}>Not Ready</Typewriter></span>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Positioner
              className="tooltip-positioner"
              side="bottom"
              sideOffset={8}
            >
              <Tooltip.Popup className="tooltip-popup status-tooltip-popup status-tooltip">
                80% checks required to pass.
              </Tooltip.Popup>
            </Tooltip.Positioner>
          </Tooltip.Portal>
        </span>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
