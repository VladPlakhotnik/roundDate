import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoadMore } from "./LoadMore";

const items = ["first", "second", "third", "fourth", "fifth"];

function renderLoadMore(customItems = items) {
  return render(
    <LoadMore items={customItems} label="Показать еще">
      {(visibleItems) => (
        <ul>
          {visibleItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </LoadMore>,
  );
}

describe("LoadMore", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show the button when all items fit into the initial list", () => {
    renderLoadMore(items.slice(0, 4));

    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("fourth")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Показать еще" })).not.toBeInTheDocument();
  });

  it("loads the remaining items and hides the button at the end", async () => {
    vi.useFakeTimers();
    renderLoadMore();

    expect(screen.queryByText("fifth")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Показать еще" }));

    expect(screen.getByText("Загружаем")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.getByText("fifth")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Показать еще" })).not.toBeInTheDocument();
  });
});
