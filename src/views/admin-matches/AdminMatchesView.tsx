"use client";

import {
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  Mars,
  Pencil,
  RotateCcw,
  Save,
  Search,
  Send,
  UserCheck,
  UserX,
  UsersRound,
  Venus,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge, type AdminBadgeTone } from "@/admin/components/AdminBadge";
import { AdminColumnVisibility } from "@/admin/components/AdminColumnVisibility";
import { AdminTable } from "@/admin/components/AdminTable";
import { getDefaultVisibleAdminColumnIds } from "@/admin/lib/default-visible-columns";
import type { AdminMatchesPageData } from "@/entities/events";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal, ModalClose } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";

import styles from "./AdminMatchesView.module.css";

type AdminMatchEvent = AdminMatchesPageData["events"][number];
type AdminMatchParticipant = AdminMatchEvent["participants"][number];

type AdminMatchesViewProps = {
  data: AdminMatchesPageData;
  publishMatchesAction: (formData: FormData) => Promise<void>;
  saveMatchesAction: (formData: FormData) => Promise<void>;
};

const eventStatusLabels: Record<AdminMatchEvent["status"], string> = {
  cancelled: "Отменено",
  draft: "Черновик",
  finished: "Завершено",
  published: "Опубликовано",
  sold_out: "Sold out",
};

const bookingStatusOptions: Array<{
  label: string;
  value: AdminMatchParticipant["status"];
}> = [
  { label: "Пришел", value: "attended" },
  { label: "Не пришел", value: "no_show" },
  { label: "Подтвержден", value: "confirmed" },
  { label: "Лист ожидания", value: "waitlisted" },
  { label: "Отмена", value: "cancelled" },
  { label: "Новая", value: "pending" },
  { label: "Ожидает оплату", value: "pending_payment" },
  { label: "Оплата не прошла", value: "payment_failed" },
  { label: "Возврат", value: "refunded" },
];

const matchEventTableColumns = [
  { id: "event", label: "Мероприятие" },
  { id: "status", label: "Результаты" },
  { id: "participants", label: "Участники" },
  { id: "female", label: "Девушки" },
  { id: "male", label: "Мужчины" },
  { id: "attendance", label: "Посещение" },
  { id: "likes", label: "Симпатии" },
  { id: "actions", label: "Действие" },
] as const;

type MatchEventTableColumnId = (typeof matchEventTableColumns)[number]["id"];
const defaultMatchEventTableColumnIds = getDefaultVisibleAdminColumnIds(matchEventTableColumns, [
  "attendance",
  "likes",
]);
const matchEventTableColumnStorageKey = "admin.matches.table.columns";

const eventFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "Europe/Warsaw",
  year: "numeric",
});

function getGenderLabel(gender: string | null) {
  const normalizedGender = gender?.trim().toLowerCase();

  if (!normalizedGender) {
    return "Пол не указан";
  }

  if (
    ["female", "woman", "women", "kobieta", "dziewczyna", "женщина", "девушка"].includes(
      normalizedGender,
    )
  ) {
    return "Женщина";
  }

  if (
    ["male", "man", "men", "mężczyzna", "mezczyzna", "парень", "мужчина"].includes(normalizedGender)
  ) {
    return "Мужчина";
  }

  return gender;
}

function getCapacityLabel(event: AdminMatchEvent) {
  return `${event.totalParticipants}/${event.capacityTotal}`;
}

function getEventSubtitle(event: AdminMatchEvent) {
  return [eventFormatter.format(event.startsAt), event.venueName].filter(Boolean).join(" · ");
}

function getMatchResultStatus(event: AdminMatchEvent): { label: string; tone: AdminBadgeTone } {
  if (event.matchResultsPublishedAt) {
    return { label: "Опубликовано", tone: "success" };
  }

  return { label: "Не опубликовано", tone: "warning" };
}

function AdminMatchesForm({
  event,
  publishMatchesAction,
  saveMatchesAction,
}: {
  event: AdminMatchEvent;
  publishMatchesAction: (formData: FormData) => Promise<void>;
  saveMatchesAction: (formData: FormData) => Promise<void>;
}) {
  const publishSubmitRef = useRef<HTMLButtonElement>(null);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [participantStatuses, setParticipantStatuses] = useState<
    Record<string, AdminMatchParticipant["status"]>
  >(() =>
    Object.fromEntries(
      event.participants.map((participant) => [participant.bookingId, participant.status]),
    ),
  );

  function getParticipantStatus(participant: AdminMatchParticipant) {
    return participantStatuses[participant.bookingId] ?? participant.status;
  }

  return (
    <form action={saveMatchesAction} className={styles.modalForm}>
      <input name="eventId" type="hidden" value={event.id} />

      <section className={styles.modalSummaryGrid} aria-label="Сводка мероприятия">
        <div className={styles.summaryPill}>
          <UsersRound aria-hidden size={18} />
          <span>Участники</span>
          <strong>{getCapacityLabel(event)}</strong>
        </div>
        <div className={styles.summaryPill}>
          <Venus aria-hidden size={18} />
          <span>Девушки</span>
          <strong>
            {event.femaleParticipants}/{event.femaleCapacity}
          </strong>
        </div>
        <div className={styles.summaryPill}>
          <Mars aria-hidden size={18} />
          <span>Мужчины</span>
          <strong>
            {event.maleParticipants}/{event.maleCapacity}
          </strong>
        </div>
        <div className={styles.summaryPill}>
          <HeartHandshake aria-hidden size={18} />
          <span>Симпатии</span>
          <strong>{event.likesCount}</strong>
        </div>
      </section>

      {event.participants.length > 0 ? (
        <AdminTable.ScrollContainer className={styles.modalTableScroll}>
          <AdminTable aria-label={`Настройка посещения и симпатий для ${event.title}`}>
            <AdminTable.Header>
              <AdminTable.Row>
                <AdminTable.Column>№</AdminTable.Column>
                <AdminTable.Column isRowHeader>Участник</AdminTable.Column>
                <AdminTable.Column>Посещение</AdminTable.Column>
                <AdminTable.Column>Контакты</AdminTable.Column>
                <AdminTable.Column>Кому поставил лайк</AdminTable.Column>
              </AdminTable.Row>
            </AdminTable.Header>
            <AdminTable.Body>
              {event.participants.map((participant) => (
                <AdminTable.Row id={participant.bookingId} key={participant.bookingId}>
                  <AdminTable.Cell>
                    <span className={styles.numberBadge}>{participant.attendeeNumber ?? "-"}</span>
                  </AdminTable.Cell>
                  <AdminTable.Cell>
                    <div className={styles.participantCell}>
                      <strong>{participant.name}</strong>
                      <small>{getGenderLabel(participant.gender)}</small>
                    </div>
                  </AdminTable.Cell>
                  <AdminTable.Cell>
                    <Select
                      className={styles.statusSelectField ?? ""}
                      name={`status:${participant.bookingId}`}
                      options={bookingStatusOptions}
                      size="sm"
                      value={getParticipantStatus(participant)}
                      onChange={(value) =>
                        setParticipantStatuses((current) => ({
                          ...current,
                          [participant.bookingId]: value as AdminMatchParticipant["status"],
                        }))
                      }
                    />
                  </AdminTable.Cell>
                  <AdminTable.Cell>
                    <div className={styles.contactText}>
                      <span>{participant.email}</span>
                      <span>{participant.phone ?? "Телефон не указан"}</span>
                    </div>
                  </AdminTable.Cell>
                  <AdminTable.Cell>
                    <label className={styles.likesInputLabel}>
                      <span className={styles.srOnly}>
                        Номера, которые понравились участнику {participant.name}
                      </span>
                      <input
                        autoComplete="off"
                        className={styles.likesInput}
                        defaultValue={participant.likesGivenToNumbers.join(", ")}
                        name={`likes:${participant.bookingId}`}
                        placeholder="Например: 2, 7, 12"
                        type="text"
                      />
                    </label>
                  </AdminTable.Cell>
                </AdminTable.Row>
              ))}
            </AdminTable.Body>
          </AdminTable>
        </AdminTable.ScrollContainer>
      ) : (
        <section className={styles.emptyState}>
          <HeartHandshake aria-hidden size={36} strokeWidth={2.1} />
          <h2>Нет участников</h2>
          <p>Когда пользователи запишутся на мероприятие, здесь появятся их номера.</p>
        </section>
      )}

      <div className={styles.modalFooter}>
        <p>Лайки вводятся номерами бейджей через запятую, пробел или с новой строки.</p>
        <div className={styles.modalFooterActions}>
          <ModalClose asChild>
            <Button variant="outline">Закрыть</Button>
          </ModalClose>
          {event.matchResultsPublishedAt ? null : (
            <Button
              leftIcon={<Send aria-hidden size={17} />}
              type="button"
              variant="soft"
              onClick={() => setIsPublishConfirmOpen(true)}
            >
              Опубликовать
            </Button>
          )}
          <Button leftIcon={<Save aria-hidden size={17} />} type="submit">
            Сохранить
          </Button>
          {event.matchResultsPublishedAt ? null : (
            <button
              ref={publishSubmitRef}
              aria-hidden="true"
              className={styles.srOnly}
              formAction={publishMatchesAction}
              tabIndex={-1}
              type="submit"
            />
          )}
        </div>
      </div>

      {event.matchResultsPublishedAt ? null : (
        <Modal
          className={styles.confirmBody}
          description="После публикации участники получат email и уведомление в профиле."
          layer="nested"
          onOpenChange={setIsPublishConfirmOpen}
          open={isPublishConfirmOpen}
          size="sm"
          title="Опубликовать результаты"
        >
          <div className={styles.confirmForm}>
            <p className={styles.confirmText}>
              Опубликовать результаты для мероприятия {event.title}? Текущие значения формы будут
              сохранены перед публикацией.
            </p>
            <div className={styles.confirmActions}>
              <ModalClose asChild>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </ModalClose>
              <Button
                leftIcon={<Send aria-hidden size={17} />}
                type="button"
                onClick={() => {
                  setIsPublishConfirmOpen(false);
                  publishSubmitRef.current?.click();
                }}
              >
                Опубликовать
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </form>
  );
}

export function AdminMatchesView({
  data,
  publishMatchesAction,
  saveMatchesAction,
}: AdminMatchesViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasMountedRef = useRef(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);
  const [query, setQuery] = useState(data.filters.q);
  const debouncedQuery = useDebounce(query, 320);
  const [statusFilter, setStatusFilter] = useState(data.filters.status);
  const [visibleMatchEventColumnIds, setVisibleMatchEventColumnIds] = useState<string[]>(() => [
    ...defaultMatchEventTableColumnIds,
  ]);
  const editingEvent = useMemo(
    () => data.events.find((event) => event.id === editingEventId) ?? null,
    [data.events, editingEventId],
  );
  const publishingEvent = useMemo(
    () => data.events.find((event) => event.id === publishingEventId) ?? null,
    [data.events, publishingEventId],
  );
  const totals = useMemo(
    () =>
      data.events.reduce(
        (summary, event) => ({
          events: summary.events + 1,
          likes: summary.likes + event.likesCount,
          mutualMatches: summary.mutualMatches + event.mutualMatchesCount,
          participants: summary.participants + event.totalParticipants,
        }),
        { events: 0, likes: 0, mutualMatches: 0, participants: 0 },
      ),
    [data.events],
  );
  const visibleMatchEventColumnSet = new Set(visibleMatchEventColumnIds);
  const hasFilters = Boolean(data.filters.q || data.filters.status !== "all");

  function isMatchEventColumnVisible(columnId: MatchEventTableColumnId) {
    return visibleMatchEventColumnSet.has(columnId);
  }

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const params = new URLSearchParams();
    const nextQuery = debouncedQuery.trim();

    if (nextQuery.length >= 2) {
      params.set("q", nextQuery.slice(0, 120));
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [debouncedQuery, pathname, router, statusFilter]);

  return (
    <div className={styles.page}>
      <AdminCard className={styles.headerCard}>
        <AdminCard.Content className={styles.headerContent}>
          <div>
            <AdminBadge size="sm" tone="neutral">
              Admin workspace
            </AdminBadge>
            <h1>Мэтчи</h1>
            <p>
              Управляйте результатами по мероприятиям: отмечайте посещение, переносите симпатии с
              анкет и открывайте пользователям только взаимные совпадения.
            </p>
          </div>
          <span className={styles.headerIcon}>
            <HeartHandshake aria-hidden size={30} strokeWidth={2.1} />
          </span>
        </AdminCard.Content>
      </AdminCard>

      <section className={styles.summaryGrid} aria-label="Сводка по мэтчам">
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span>
              <CalendarDays aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Мероприятия</small>
              <strong>{totals.events}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="numbers">
              <UsersRound aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Участники</small>
              <strong>{totals.participants}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="likes">
              <HeartHandshake aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Симпатии</small>
              <strong>{totals.likes}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="matches">
              <CheckCircle2 aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Взаимные</small>
              <strong>{totals.mutualMatches}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
      </section>

      <AdminCard>
        <AdminCard.Content>
          <div className={styles.filters}>
            <Input
              className={styles.searchField}
              label="Поиск"
              leftIcon={<Search aria-hidden size={17} strokeWidth={2.2} />}
              minLength={2}
              name="q"
              placeholder="Мероприятие, город или площадка"
              size="sm"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <Select
              label="Статус"
              name="status"
              options={[
                { label: "Все статусы", value: "all" },
                { label: eventStatusLabels.draft, value: "draft" },
                { label: eventStatusLabels.published, value: "published" },
                { label: eventStatusLabels.finished, value: "finished" },
                { label: eventStatusLabels.sold_out, value: "sold_out" },
                { label: eventStatusLabels.cancelled, value: "cancelled" },
              ]}
              size="sm"
              value={statusFilter}
              onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            />
            <AdminColumnVisibility
              columns={matchEventTableColumns}
              storageKey={matchEventTableColumnStorageKey}
              visibleColumnIds={visibleMatchEventColumnIds}
              onVisibleColumnIdsChange={setVisibleMatchEventColumnIds}
            />
            {hasFilters ? (
              <Link className={styles.resetLink} href="/admin/matches">
                <RotateCcw aria-hidden size={16} strokeWidth={2.3} />
                Сбросить
              </Link>
            ) : null}
          </div>
        </AdminCard.Content>
      </AdminCard>

      <AdminCard>
        <AdminCard.Header className={styles.tableHeader}>
          <div>
            <AdminCard.Title>Мероприятия</AdminCard.Title>
            <AdminCard.Description>
              Откройте мероприятие, чтобы отметить кто пришел и кому участники поставили лайки.
            </AdminCard.Description>
          </div>
          <AdminBadge size="sm" tone="neutral">
            {data.events.length}
          </AdminBadge>
        </AdminCard.Header>

        <AdminCard.Content>
          {data.events.length > 0 ? (
            <>
              <AdminTable.ScrollContainer>
                <AdminTable aria-label="Мероприятия для настройки мэтчей">
                  <AdminTable.Header>
                    <AdminTable.Row>
                      {isMatchEventColumnVisible("event") ? (
                        <AdminTable.Column isRowHeader>Мероприятие</AdminTable.Column>
                      ) : null}
                      {isMatchEventColumnVisible("status") ? (
                        <AdminTable.Column>Результаты</AdminTable.Column>
                      ) : null}
                      {isMatchEventColumnVisible("participants") ? (
                        <AdminTable.Column>Участники</AdminTable.Column>
                      ) : null}
                      {isMatchEventColumnVisible("female") ? (
                        <AdminTable.Column>Девушки</AdminTable.Column>
                      ) : null}
                      {isMatchEventColumnVisible("male") ? (
                        <AdminTable.Column>Мужчины</AdminTable.Column>
                      ) : null}
                      {isMatchEventColumnVisible("attendance") ? (
                        <AdminTable.Column>Посещение</AdminTable.Column>
                      ) : null}
                      {isMatchEventColumnVisible("likes") ? (
                        <AdminTable.Column>Симпатии</AdminTable.Column>
                      ) : null}
                      {isMatchEventColumnVisible("actions") ? (
                        <AdminTable.Column>Действие</AdminTable.Column>
                      ) : null}
                    </AdminTable.Row>
                  </AdminTable.Header>
                  <AdminTable.Body>
                    {data.events.map((event) => (
                      <AdminTable.Row id={event.id} key={event.id}>
                        {isMatchEventColumnVisible("event") ? (
                          <AdminTable.Cell>
                            <div className={styles.eventCell}>
                              <strong>{event.title}</strong>
                              <small>{getEventSubtitle(event)}</small>
                            </div>
                          </AdminTable.Cell>
                        ) : null}
                        {isMatchEventColumnVisible("status") ? (
                          <AdminTable.Cell>
                            <AdminBadge size="sm" tone={getMatchResultStatus(event).tone}>
                              {getMatchResultStatus(event).label}
                            </AdminBadge>
                          </AdminTable.Cell>
                        ) : null}
                        {isMatchEventColumnVisible("participants") ? (
                          <AdminTable.Cell>
                            <span className={styles.metricText}>{getCapacityLabel(event)}</span>
                          </AdminTable.Cell>
                        ) : null}
                        {isMatchEventColumnVisible("female") ? (
                          <AdminTable.Cell>
                            <span className={styles.genderMetric}>
                              <Venus aria-hidden size={15} />
                              {event.femaleParticipants}/{event.femaleCapacity}
                            </span>
                          </AdminTable.Cell>
                        ) : null}
                        {isMatchEventColumnVisible("male") ? (
                          <AdminTable.Cell>
                            <span className={styles.genderMetric}>
                              <Mars aria-hidden size={15} />
                              {event.maleParticipants}/{event.maleCapacity}
                            </span>
                          </AdminTable.Cell>
                        ) : null}
                        {isMatchEventColumnVisible("attendance") ? (
                          <AdminTable.Cell>
                            <div className={styles.attendanceMetrics}>
                              <span>
                                <UserCheck aria-hidden size={14} />
                                {event.attendedCount}
                              </span>
                              <span>
                                <UserX aria-hidden size={14} />
                                {event.noShowCount}
                              </span>
                            </div>
                          </AdminTable.Cell>
                        ) : null}
                        {isMatchEventColumnVisible("likes") ? (
                          <AdminTable.Cell>
                            <div className={styles.likesMetrics}>
                              <span>{event.likesCount} всего</span>
                              <small>{event.mutualMatchesCount} взаимных</small>
                            </div>
                          </AdminTable.Cell>
                        ) : null}
                        {isMatchEventColumnVisible("actions") ? (
                          <AdminTable.Cell>
                            <div className={styles.rowActions}>
                              <Button
                                aria-label={
                                  event.matchResultsPublishedAt
                                    ? `Изменить результаты ${event.title}`
                                    : `Настроить матчи ${event.title}`
                                }
                                leftIcon={<Pencil aria-hidden size={16} />}
                                onClick={() => setEditingEventId(event.id)}
                                size="icon"
                                title={
                                  event.matchResultsPublishedAt
                                    ? "Изменить результаты"
                                    : "Настроить"
                                }
                                variant="outline"
                              />
                              {event.matchResultsPublishedAt ? null : (
                                <Button
                                  aria-label={`Опубликовать результаты: ${event.title}`}
                                  leftIcon={<Send aria-hidden size={16} />}
                                  onClick={() => setPublishingEventId(event.id)}
                                  size="icon"
                                  title="Опубликовать результаты"
                                  variant="outline"
                                />
                              )}
                            </div>
                          </AdminTable.Cell>
                        ) : null}
                      </AdminTable.Row>
                    ))}
                  </AdminTable.Body>
                </AdminTable>
              </AdminTable.ScrollContainer>
            </>
          ) : (
            <section className={styles.emptyState}>
              <HeartHandshake aria-hidden size={36} strokeWidth={2.1} />
              <h2>Пока нет мероприятий</h2>
              <p>Создайте мероприятие, чтобы после него заполнить взаимные симпатии.</p>
            </section>
          )}
        </AdminCard.Content>
      </AdminCard>

      <Modal
        className={styles.modalBody}
        contentClassName={styles.modalContent}
        description={editingEvent ? getEventSubtitle(editingEvent) : undefined}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEventId(null);
          }
        }}
        open={Boolean(editingEvent)}
        size="xl"
        title={editingEvent ? `Мэтчи: ${editingEvent.title}` : "Мэтчи"}
      >
        {editingEvent ? (
          <AdminMatchesForm
            event={editingEvent}
            publishMatchesAction={publishMatchesAction}
            saveMatchesAction={saveMatchesAction}
          />
        ) : null}
      </Modal>

      <Modal
        className={styles.confirmBody}
        description="После публикации участники получат email и уведомление в профиле."
        onOpenChange={(open) => {
          if (!open) {
            setPublishingEventId(null);
          }
        }}
        open={Boolean(publishingEvent)}
        size="sm"
        title="Опубликовать результаты"
      >
        {publishingEvent ? (
          <form
            action={publishMatchesAction}
            className={styles.confirmForm}
            onSubmit={() => setPublishingEventId(null)}
          >
            <input name="eventId" type="hidden" value={publishingEvent.id} />
            <p className={styles.confirmText}>
              Опубликовать результаты для мероприятия {publishingEvent.title}? Мы отправим
              участникам email и уведомление в профиле.
            </p>
            <div className={styles.confirmActions}>
              <ModalClose asChild>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </ModalClose>
              <Button leftIcon={<Send aria-hidden size={17} />} type="submit">
                Опубликовать
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}
