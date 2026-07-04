import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

  it("can render nested dialogs above the base modal layer", () => {
    const nestedLayerProps = { layer: "nested" } as const;

    render(
      <Modal open title="Связаться с организатором" {...nestedLayerProps}>
        <p>Контакты организатора</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Связаться с организатором" });
    const overlay = document.querySelector('[data-modal-overlay][data-modal-layer="nested"]');

    expect(dialog).toHaveAttribute("data-modal-layer", "nested");
    expect(dialog.className).toContain("contentNested");
    expect(overlay).toBeInTheDocument();
    expect(overlay?.className).toContain("overlayNested");
  });

  it("supports an opt-in fullscreen mobile layout", () => {
    render(
      <Modal open title="Login" mobileFullscreen>
        <p>Auth form</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog", { name: "Login" });
    const closeButton = screen.getByRole("button", { name: "Zamknij okno" });
    const css = readFileSync(join(process.cwd(), "src/shared/ui/Modal/Modal.module.css"), "utf8");

    expect(dialog).toHaveAttribute("data-mobile-fullscreen", "true");
    expect(closeButton).toHaveAttribute("data-modal-close");
    expect(css).toContain('.content[data-mobile-fullscreen="true"]');
    expect(css).toContain("width: 100vw;");
    expect(css).toContain("height: 100dvh;");
    expect(css).toContain("border-radius: 0;");
    expect(css).toContain("animation: modal-mobile-fullscreen-in 180ms ease;");
    expect(css).toContain('.content[data-mobile-fullscreen="true"] .close');
    expect(css).toContain("top: calc(12px + env(safe-area-inset-top));");
    expect(css).toContain("@keyframes modal-mobile-fullscreen-in");
  });
});
