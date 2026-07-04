import type { EventStatus } from "@/shared/types";

export type AdminEventRowAction = "delete" | "details" | "edit" | "publish";

export type EventPublishState =
  | {
      label: string;
      publishAt: string | null;
      state: "cancelled" | "draft" | "finished" | "published" | "sold_out";
    }
  | {
      label: string;
      publishAt: string;
      state: "scheduled";
    };

type EventWorkflowInput = {
  metadata?: Record<string, unknown> | null;
  status: EventStatus;
};

type ScheduledPublishInput = EventWorkflowInput & {
  now?: Date;
};

function readPublishAt(metadata: Record<string, unknown> | null | undefined) {
  const value = metadata?.publishAt;

  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function getEventPublishState(input: EventWorkflowInput): EventPublishState {
  const publishAt = readPublishAt(input.metadata);

  if (input.status === "draft" && publishAt) {
    return {
      label: "Запланировано",
      publishAt,
      state: "scheduled",
    };
  }

  if (input.status === "published") {
    return { label: "Опубликовано", publishAt, state: "published" };
  }

  if (input.status === "finished") {
    return { label: "Завершено", publishAt, state: "finished" };
  }

  if (input.status === "cancelled") {
    return { label: "Отменено", publishAt, state: "cancelled" };
  }

  if (input.status === "sold_out") {
    return { label: "Sold out", publishAt, state: "sold_out" };
  }

  return { label: "Черновик", publishAt, state: "draft" };
}

export function shouldPublishScheduledEvent(input: ScheduledPublishInput) {
  const publishAt = readPublishAt(input.metadata);

  if (input.status !== "draft" || !publishAt) {
    return false;
  }

  return new Date(publishAt).getTime() <= (input.now ?? new Date()).getTime();
}

export function getEventRowActions(input: Pick<EventWorkflowInput, "status">) {
  const actions: AdminEventRowAction[] = [];

  if (input.status === "draft") {
    actions.push("publish");
  }

  actions.push("details", "edit", "delete");

  return actions;
}

export function getScheduledPublishDateTime(value: string | null | undefined) {
  const publishAt = readPublishAt(value ? { publishAt: value } : null);

  if (!publishAt) {
    return { date: "", time: "" };
  }

  return {
    date: publishAt.slice(0, 10),
    time: publishAt.slice(11, 16),
  };
}
