import type { EventStatus } from "@/shared/types";

export type EventsListFilters = {
  ageFrom?: number;
  ageTo?: number;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  district?: string;
  includePast?: boolean;
  priceFrom?: number;
  priceTo?: number;
  query?: string;
  sort?: "date" | "price-asc" | "price-desc";
  status?: EventStatus | EventStatus[];
  tag?: "all" | "closest" | "today" | "week" | "weekend";
};

export const eventsQueryKeys = {
  all: ["events"] as const,
  detail: (slug: string) => [...eventsQueryKeys.all, "detail", slug] as const,
  list: (filters?: EventsListFilters) =>
    filters
      ? ([...eventsQueryKeys.all, "list", filters] as const)
      : ([...eventsQueryKeys.all, "list"] as const),
};
