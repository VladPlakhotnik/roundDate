import { render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it } from "vitest";

import { useFloatingPopover } from "./useFloatingPopover";

function PopoverProbe() {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const style = useFloatingPopover(true, triggerRef, {
    maxWidth: 342,
    minWidth: 292,
    preferredWidth: 318,
    viewportPadding: 12,
  });

  return (
    <>
      <button
        ref={(node) => {
          triggerRef.current = node;

          if (node) {
            node.getBoundingClientRect = () =>
              ({
                bottom: 80,
                height: 40,
                left: 500,
                right: 620,
                top: 40,
                width: 120,
                x: 500,
                y: 40,
                toJSON: () => undefined,
              }) as DOMRect;
          }
        }}
        type="button"
      >
        Trigger
      </button>
      <output data-testid="popover-left">{style?.left}</output>
    </>
  );
}

describe("useFloatingPopover", () => {
  it("centers wider popovers relative to the trigger", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1200 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });

    render(<PopoverProbe />);

    expect(screen.getByTestId("popover-left")).toHaveTextContent("401");
  });
});
