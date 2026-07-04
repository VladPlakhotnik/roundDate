import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDebounce } from "./useDebounce";

function DebounceProbe({ value }: { value: string }) {
  const debouncedValue = useDebounce(value, 300);

  return <output data-testid="debounced-value">{debouncedValue}</output>;
}

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("updates the value only after the delay", () => {
    vi.useFakeTimers();

    const { rerender } = render(<DebounceProbe value="first" />);

    expect(screen.getByTestId("debounced-value")).toHaveTextContent("first");

    rerender(<DebounceProbe value="second" />);

    expect(screen.getByTestId("debounced-value")).toHaveTextContent("first");

    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(screen.getByTestId("debounced-value")).toHaveTextContent("first");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(screen.getByTestId("debounced-value")).toHaveTextContent("second");
  });
});
