import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeView } from "./page";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

const mocks = vi.hoisted(() => ({
  getHomeEvents: vi.fn(),
  heroProps: [] as Array<{ featuredEvent?: { title: string } }>,
}));

vi.mock("@/entities/events", () => ({
  getHomeEvents: mocks.getHomeEvents,
}));

vi.mock("@/shared/server/auth/auth", () => ({
  getAuth: () => ({
    api: {
      getSession: vi.fn(() => Promise.resolve(null)),
    },
  }),
}));

vi.mock("@/shared/server/db/client", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/widgets/home-atmosphere", () => ({
  HomeAtmosphere: () => <section data-testid="home-atmosphere" />,
}));

vi.mock("@/widgets/home-how-it-works", () => ({
  HomeHowItWorks: () => <section data-testid="home-how-it-works" />,
}));

vi.mock("@/widgets/home-why-better", () => ({
  HomeWhyBetter: () => <section data-testid="home-why-better" />,
}));

vi.mock("@/widgets/home-waitlist-footer", () => ({
  HomeWaitlistFooter: () => <section data-testid="home-waitlist-footer" />,
}));

vi.mock("@/widgets/home-hero", () => ({
  HomeHero: (props: { featuredEvent?: { title: string } }) => {
    mocks.heroProps.push(props);

    return (
      <section data-testid="home-hero">
        {props.featuredEvent ? props.featuredEvent.title : "no featured event"}
      </section>
    );
  },
}));

vi.mock("@/widgets/home-events", () => ({
  HomeEvents: (props: { events: Array<{ title: string }> }) => (
    <section data-testid="home-events">
      {props.events.map((event) => event.title).join(", ")}
    </section>
  ),
}));

describe("HomeView", () => {
  beforeEach(() => {
    mocks.getHomeEvents.mockReset();
    mocks.heroProps = [];
  });

  it("requests real landing events without seed fallback and uses the nearest event in the hero", async () => {
    mocks.getHomeEvents.mockResolvedValue([
      { id: "nearest", title: "Nearest real event" },
      { id: "later", title: "Later real event" },
    ]);

    render(await HomeView());

    expect(mocks.getHomeEvents).toHaveBeenCalledWith({ useFallback: false });
    expect(screen.getByTestId("home-hero")).toHaveTextContent("Nearest real event");
    expect(screen.getByTestId("home-events")).toHaveTextContent(
      "Nearest real event, Later real event",
    );
  });

  it("hides the upcoming events section when there are no real upcoming events", async () => {
    mocks.getHomeEvents.mockResolvedValue([]);

    render(await HomeView());

    expect(screen.getByTestId("home-hero")).toHaveTextContent("no featured event");
    expect(screen.queryByTestId("home-events")).not.toBeInTheDocument();
  });
});
