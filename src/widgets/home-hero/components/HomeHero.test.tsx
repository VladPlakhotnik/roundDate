import { render, screen } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { I18nProvider } from "@/shared/i18n/I18nProvider";

import { HomeHero } from "./HomeHero";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props),
}));

vi.mock("@/features/auth", () => ({
  AuthModal: ({ trigger }: { trigger: ReactNode }) => <>{trigger}</>,
}));

vi.mock("./HeroChairScene", () => ({
  HeroChairScene: (props: { className?: string }) => <div className={props.className} />,
}));

function renderHero() {
  render(
    <I18nProvider locale="en">
      <HomeHero />
    </I18nProvider>,
  );
}

describe("HomeHero", () => {
  it("does not show a fake upcoming event card when no featured event exists", () => {
    renderHero();

    expect(screen.queryByLabelText("Upcoming event")).not.toBeInTheDocument();
    expect(screen.getByLabelText("New event notifications")).toBeInTheDocument();
    expect(screen.getByText("New dates soon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Events" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find your event" })).toHaveAttribute(
      "href",
      "#waitlist",
    );
    expect(screen.getByRole("link", { name: "Notify about new dates" })).toHaveAttribute(
      "href",
      "#waitlist",
    );
  });
});
