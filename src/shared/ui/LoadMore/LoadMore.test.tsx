import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadMore } from "./LoadMore";

const items = ["first", "second", "third", "fourth", "fifth"];

function renderLoadMore(customItems = items) {
  return render(
    <LoadMore items={customItems} label="Pokaż więcej">
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
  it("does not show the button when all items fit into the initial list", () => {
    renderLoadMore(items.slice(0, 4));

    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("fourth")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pokaż więcej" })).not.toBeInTheDocument();
  });

  it("loads the remaining items and hides the button at the end", async () => {
    renderLoadMore();

    expect(screen.queryByText("fifth")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pokaż więcej" }));

    expect(screen.getByText("Ładujemy")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("fifth")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Pokaż więcej" })).not.toBeInTheDocument();
    });
  });
});
