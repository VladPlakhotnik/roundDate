import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminEventListItem, AdminEventOwner } from "@/admin/server/events";
import type { AdminVenueListItem } from "@/admin/server/venues";

import { AdminEventsView } from "./AdminEventsView";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/events",
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock("@/shared/ui/Map", () => ({
  Map: ({ marker }: { marker?: { point: { latitude: number; longitude: number } } }) => (
    <div aria-label="Map" role="region">
      {marker ? (
        <button type="button">
          {marker.point.latitude}, {marker.point.longitude}
        </button>
      ) : null}
    </div>
  ),
}));

const admins: AdminEventOwner[] = [
  {
    email: "admin@example.com",
    firstName: "Admin",
    id: "admin-1",
    image: null,
    lastName: "User",
    name: "Admin User",
    phone: null,
  },
];

const venues: AdminVenueListItem[] = [
  {
    address: "ul. Opacka 12, Gdansk",
    capacity: 16,
    city: "Gdansk",
    district: "Oliwa",
    eventsCount: 1,
    id: "venue-1",
    latitude: 54.4104,
    longitude: 18.5605,
    mapUrl: null,
    name: "Garden lounge",
    updatedAt: new Date("2026-06-01T10:00:00.000Z"),
  },
  {
    address: "ul. Torunska 12, Gdansk",
    capacity: 24,
    city: "Gdansk",
    district: "Srodmiescie",
    eventsCount: 2,
    id: "venue-2",
    latitude: 54.344,
    longitude: 18.654,
    mapUrl: null,
    name: "Hotel Almond",
    updatedAt: new Date("2026-06-02T10:00:00.000Z"),
  },
];

const event: AdminEventListItem = {
  adminUserId: "admin-1",
  ageMax: 35,
  ageMin: 25,
  badge: "Идет набор",
  capacityTotal: 16,
  city: "Gdansk",
  conversationMinutes: 10,
  currency: "PLN",
  description: "Камерный вечер",
  durationMinutes: 120,
  femaleCapacity: 8,
  femaleSpotsAvailable: 8,
  id: "event-1",
  imageSrc: "/assets/home-events/chairs-date.png",
  language: "RU/PL",
  maleCapacity: 8,
  maleSpotsAvailable: 8,
  metadata: { addressMode: "existing", latitude: 54.4104, longitude: 18.5605 },
  organizerEmail: "admin@example.com",
  organizerFirstName: "Admin",
  organizerImage: null,
  organizerLastName: "User",
  organizerPhone: null,
  priceGroszy: 12900,
  publishState: {
    label: "Опубликовано",
    publishAt: null,
    state: "published",
  },
  slug: "speed-dating-intro-2031-06-14",
  spotsAvailable: 16,
  startsAt: new Date("2031-06-14T18:00:00.000Z"),
  status: "published",
  title: "RoundDate intro",
  venueAddress: "ul. Opacka 12, Gdansk",
  venueDistrict: "Oliwa",
  venueId: "venue-1",
  venueLatitude: 54.4104,
  venueLongitude: 18.5605,
  venueName: "Garden lounge",
};

function renderView({
  deleteEventAction = vi.fn(async () => undefined),
  updateEventAction = vi.fn(async () => undefined),
}: {
  deleteEventAction?: (formData: FormData) => Promise<void>;
  updateEventAction?: (formData: FormData) => Promise<void>;
} = {}) {
  render(
    <AdminEventsView
      admins={admins}
      createEventAction={vi.fn(async () => undefined)}
      currentAdminId="admin-1"
      deleteEventAction={deleteEventAction}
      events={[event]}
      filters={{ q: "", status: "all" }}
      publishEventAction={vi.fn(async () => undefined)}
      updateEventAction={updateEventAction}
      venues={venues}
    />,
  );
}

function openEditDialog() {
  fireEvent.click(screen.getByRole("button", { name: "Изменить RoundDate intro" }));

  return screen.getByRole("dialog", { name: "Изменить мероприятие" });
}

describe("AdminEventsView edit modal", () => {
  it("edits cover through the same cover picker used by creation", () => {
    renderView();

    const editDialog = openEditDialog();

    expect(within(editDialog).queryByLabelText("Обложка")).not.toBeInTheDocument();

    fireEvent.click(within(editDialog).getByRole("button", { name: "Выбрать обложку" }));
    const coverDialog = screen.getByRole("dialog", { name: "Обложка мероприятия" });

    fireEvent.click(within(coverDialog).getByRole("button", { name: "Круглый стол" }));
    fireEvent.click(within(coverDialog).getByRole("button", { name: "Готово" }));

    const form = editDialog.querySelector("form");

    expect(form?.querySelector('input[name="coverSrc"]')).toHaveValue(
      "/assets/home-events/chairs-flowers.png",
    );
    expect(within(editDialog).getByText("Круглый стол")).toBeInTheDocument();
  });

  it("edits address through the same address picker and submits venue fields", () => {
    renderView();

    const editDialog = openEditDialog();

    fireEvent.click(within(editDialog).getByRole("button", { name: "Выбрать адрес" }));
    const addressDialog = screen.getByRole("dialog", { name: "Адрес мероприятия" });

    fireEvent.click(
      within(addressDialog).getByRole("button", {
        name: "Hotel Almond ul. Torunska 12, Gdansk",
      }),
    );
    fireEvent.click(within(addressDialog).getByRole("button", { name: "Готово" }));

    const form = editDialog.querySelector("form");

    expect(form?.querySelector('input[name="venueId"]')).toHaveValue("venue-2");
    expect(form?.querySelector('input[name="venueName"]')).toHaveValue("Hotel Almond");
    expect(form?.querySelector('input[name="venueAddress"]')).toHaveValue(
      "ul. Torunska 12, Gdansk",
    );
    expect(form?.querySelector('input[name="city"]')).toHaveValue("Gdansk");
    expect(form?.querySelector('input[name="district"]')).toHaveValue("Srodmiescie");
    expect(form?.querySelector('input[name="latitude"]')).toHaveValue("54.344");
    expect(form?.querySelector('input[name="longitude"]')).toHaveValue("18.654");
    expect(form?.querySelector('input[name="addressMode"]')).toHaveValue("existing");
    expect(within(editDialog).getByText("Hotel Almond")).toBeInTheDocument();
  });

  it("closes delete modal when delete form is submitted", () => {
    const deleteEventAction = vi.fn(async () => undefined);

    renderView({ deleteEventAction });

    fireEvent.click(screen.getByRole("button", { name: "Удалить RoundDate intro" }));
    const deleteDialog = screen.getByRole("dialog", { name: "Удалить мероприятие" });
    const form = deleteDialog.querySelector("form");

    expect(form).not.toBeNull();

    fireEvent.submit(form!);

    expect(screen.queryByRole("dialog", { name: "Удалить мероприятие" })).not.toBeInTheDocument();
  });
});
