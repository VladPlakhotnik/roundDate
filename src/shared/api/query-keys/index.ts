import { eventsQueryKeys } from "./events";
import { profileQueryKeys } from "./profile";
import { settingsQueryKeys } from "./settings";

export const queryKeys = {
  events: eventsQueryKeys,
  profile: profileQueryKeys,
  settings: settingsQueryKeys,
};

export { eventsQueryKeys, profileQueryKeys, settingsQueryKeys };
export type { EventsListFilters } from "./events";
export type { ProfileBookingStatus } from "./profile";
