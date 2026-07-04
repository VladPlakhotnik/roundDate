import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminColumnVisibility } from "./AdminColumnVisibility";

const columns = [
  { id: "event", label: "Мероприятие" },
  { id: "date", label: "Дата" },
  { id: "status", label: "Статус" },
];

function VisibilityHarness({
  onChange = vi.fn(),
  storageKey,
}: {
  onChange?: (ids: string[]) => void;
  storageKey?: string;
}) {
  const [visibleColumnIds, setVisibleColumnIds] = useState(["event", "date"]);

  return (
    <AdminColumnVisibility
      columns={columns}
      {...(storageKey ? { storageKey } : {})}
      visibleColumnIds={visibleColumnIds}
      onVisibleColumnIdsChange={(nextIds) => {
        setVisibleColumnIds(nextIds);
        onChange(nextIds);
      }}
    />
  );
}

describe("AdminColumnVisibility", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("toggles reusable table column visibility", () => {
    const onChange = vi.fn();

    render(<VisibilityHarness onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Колонки" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Статус" }));

    expect(onChange).toHaveBeenLastCalledWith(["event", "date", "status"]);

    fireEvent.click(screen.getByRole("checkbox", { name: "Дата" }));

    expect(onChange).toHaveBeenLastCalledWith(["event", "status"]);
  });

  it("renders the columns menu outside the local container so cards cannot clip it", () => {
    const { container } = render(<VisibilityHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Колонки" }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(container.querySelector('[role="menu"]')).toBeNull();
  });

  it("keeps at least one column visible", () => {
    render(<VisibilityHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Колонки" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Дата" }));

    expect(screen.getByRole("checkbox", { name: "Мероприятие" })).toBeDisabled();
  });

  it("restores and persists visible columns in local storage", async () => {
    localStorage.setItem("admin.columns.test", JSON.stringify(["date"]));

    render(<VisibilityHarness storageKey="admin.columns.test" />);

    fireEvent.click(screen.getByRole("button", { name: "Колонки" }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Дата" })).toBeChecked();
    });

    expect(screen.getByRole("checkbox", { name: "Мероприятие" })).not.toBeChecked();

    fireEvent.click(screen.getByRole("checkbox", { name: "Статус" }));

    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem("admin.columns.test") ?? "[]")).toEqual([
        "date",
        "status",
      ]);
    });
  });
});
