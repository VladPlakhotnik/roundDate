import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders visible titles with the default title class", () => {
    render(
      <Modal open title="Изменить имя">
        <p>Содержимое модалки</p>
      </Modal>,
    );

    const title = screen.getByRole("heading", { name: "Изменить имя" });

    expect(title.className).toContain("title");
    expect(title.className).not.toContain("titleSrOnly");
  });

  it("can keep a dialog title accessible without showing a visual header", () => {
    render(
      <Modal open title="Детали мероприятия" visuallyHiddenTitle>
        <p>Содержимое модалки</p>
      </Modal>,
    );

    const title = screen.getByRole("heading", { name: "Детали мероприятия" });

    expect(title.className).toContain("titleSrOnly");
  });
});
