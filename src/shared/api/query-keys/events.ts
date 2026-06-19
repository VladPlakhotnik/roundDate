export type EventsListFilters = {
  city?: string;
  status?: "draft" | "published" | "sold_out";
};

export const eventsQueryKeys = {
  all: ["events"] as const,
  detail: (slug: string) => [...eventsQueryKeys.all, "detail", slug] as const,
  list: (filters?: EventsListFilters) =>
    filters
      ? ([...eventsQueryKeys.all, "list", filters] as const)
      : ([...eventsQueryKeys.all, "list"] as const),
};
