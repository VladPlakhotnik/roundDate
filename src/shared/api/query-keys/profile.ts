export type ProfileBookingStatus = "past" | "upcoming";

export const profileQueryKeys = {
  all: ["profile"] as const,
  bookings: (status?: ProfileBookingStatus) =>
    status
      ? ([...profileQueryKeys.all, "bookings", { status }] as const)
      : ([...profileQueryKeys.all, "bookings"] as const),
  current: () => [...profileQueryKeys.all, "current"] as const,
  matches: () => [...profileQueryKeys.all, "matches"] as const,
};
