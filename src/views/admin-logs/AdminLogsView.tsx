"use client";

import { Clock3, Database, RotateCcw, ScrollText, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge, type AdminBadgeTone } from "@/admin/components/AdminBadge";
import { AdminTable } from "@/admin/components/AdminTable";
import type {
  AdminAuditLogFilters,
  AdminAuditLogItem,
  AdminAuditLogsPageData,
} from "@/admin/server/audit-logs";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

import styles from "./AdminLogsView.module.css";

type AdminLogsViewProps = {
  data: AdminAuditLogsPageData;
  filters: AdminAuditLogFilters;
};

const actionOptions = [
  { label: "Все действия", value: "all" },
  { label: "Мероприятие создано", value: "event.created" },
  { label: "Мероприятие обновлено", value: "event.updated" },
  { label: "Мероприятие опубликовано", value: "event.published" },
  { label: "Мероприятие удалено", value: "event.deleted" },
  { label: "Адрес создан", value: "venue.created" },
  { label: "Адрес обновлен", value: "venue.updated" },
  { label: "Адрес удален", value: "venue.deleted" },
  { label: "Пользователь заблокирован", value: "user.banned" },
  { label: "Пользователь разблокирован", value: "user.unbanned" },
  { label: "Матчи обновлены", value: "matches.updated" },
];

const entityOptions = [
  { label: "Все сущности", value: "all" },
  { label: "Мероприятия", value: "event" },
  { label: "Адреса", value: "venue" },
  { label: "Пользователи", value: "user" },
];

const actionTones: Record<string, AdminBadgeTone> = {
  "event.created": "success",
  "event.deleted": "danger",
  "event.published": "info",
  "event.updated": "warning",
  "matches.updated": "info",
  "user.banned": "danger",
  "user.unbanned": "success",
  "venue.created": "success",
  "venue.deleted": "danger",
  "venue.updated": "warning",
};

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  month: "short",
  timeZone: "Europe/Warsaw",
  year: "numeric",
});

function getActionLabel(action: string) {
  return actionOptions.find((option) => option.value === action)?.label ?? action;
}

function getEntityLabel(entityType: string) {
  return entityOptions.find((option) => option.value === entityType)?.label ?? entityType;
}

function getActorLabel(log: AdminAuditLogItem) {
  return log.actorName || log.actorEmail || "Система";
}

function MetadataPreview({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className={styles.mutedText}>Нет данных</span>;
  }

  return (
    <details className={styles.metadataDetails}>
      <summary>Данные</summary>
      <pre>{JSON.stringify(metadata, null, 2)}</pre>
    </details>
  );
}

export function AdminLogsView({ data, filters }: AdminLogsViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasMountedRef = useRef(false);
  const [query, setQuery] = useState(filters.q);
  const debouncedQuery = useDebounce(query, 320);
  const [action, setAction] = useState(filters.action);
  const [entity, setEntity] = useState(filters.entity);
  const hasFilters = Boolean(filters.q || filters.action !== "all" || filters.entity !== "all");
  const actorCount = useMemo(
    () => new Set(data.logs.map((log) => log.actorUserId ?? log.actorEmail ?? "system")).size,
    [data.logs],
  );

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

    if (action !== "all") {
      params.set("action", action);
    }

    if (entity !== "all") {
      params.set("entity", entity);
    }

    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    });
  }, [action, debouncedQuery, entity, pathname, router]);

  return (
    <div className={styles.page}>
      <AdminCard className={styles.headerCard}>
        <AdminCard.Content className={styles.header}>
          <div>
            <AdminBadge size="sm" tone="neutral">
              Admin workspace
            </AdminBadge>
            <h1>Журнал логов</h1>
            <p>
              История важных действий в админке: изменения мероприятий, адресов, пользователей и
              мэтчей.
            </p>
          </div>
          <span className={styles.headerIcon}>
            <ScrollText aria-hidden size={30} strokeWidth={2.1} />
          </span>
        </AdminCard.Content>
      </AdminCard>

      <section className={styles.summaryGrid} aria-label="Сводка логов">
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span>
              <Database aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Найдено</small>
              <strong>{data.total}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="actors">
              <UserRound aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Акторы в выдаче</small>
              <strong>{actorCount}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="time">
              <Clock3 aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Последний лог</small>
              <strong>{data.logs[0] ? dateFormatter.format(data.logs[0].createdAt) : "Нет"}</strong>
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
              placeholder="Событие, actor, сущность"
              size="sm"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
            <Select
              label="Действие"
              name="action"
              options={actionOptions}
              size="sm"
              value={action}
              onChange={(value) => setAction(value)}
            />
            <Select
              label="Сущность"
              name="entity"
              options={entityOptions}
              size="sm"
              value={entity}
              onChange={(value) => setEntity(value)}
            />
            {hasFilters ? (
              <Link className={styles.resetLink} href="/admin/logs">
                <RotateCcw aria-hidden size={16} strokeWidth={2.3} />
                Сбросить
              </Link>
            ) : null}
          </div>
        </AdminCard.Content>
      </AdminCard>

      <AdminCard>
        <AdminCard.Content>
          {data.logs.length > 0 ? (
            <AdminTable.ScrollContainer>
              <AdminTable aria-label="Журнал действий админки">
                <AdminTable.Header>
                  <AdminTable.Row>
                    <AdminTable.Column isRowHeader>Время</AdminTable.Column>
                    <AdminTable.Column>Actor</AdminTable.Column>
                    <AdminTable.Column>Действие</AdminTable.Column>
                    <AdminTable.Column>Сущность</AdminTable.Column>
                    <AdminTable.Column>Описание</AdminTable.Column>
                    <AdminTable.Column>Metadata</AdminTable.Column>
                  </AdminTable.Row>
                </AdminTable.Header>
                <AdminTable.Body>
                  {data.logs.map((log) => (
                    <AdminTable.Row id={log.id} key={log.id}>
                      <AdminTable.Cell>
                        <time className={styles.dateText} dateTime={log.createdAt.toISOString()}>
                          {dateFormatter.format(log.createdAt)}
                        </time>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <div className={styles.actorCell}>
                          <strong>{getActorLabel(log)}</strong>
                          <small>{log.actorEmail ?? "system"}</small>
                        </div>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <AdminBadge size="sm" tone={actionTones[log.action] ?? "neutral"}>
                          {getActionLabel(log.action)}
                        </AdminBadge>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <span className={styles.entityText}>
                          {getEntityLabel(log.entityType)}
                          {log.entityId ? <small>{log.entityId}</small> : null}
                        </span>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <span className={styles.summaryText}>{log.summary}</span>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <MetadataPreview metadata={log.metadata} />
                      </AdminTable.Cell>
                    </AdminTable.Row>
                  ))}
                </AdminTable.Body>
              </AdminTable>
            </AdminTable.ScrollContainer>
          ) : (
            <div className={styles.emptyState}>
              <ScrollText aria-hidden size={32} strokeWidth={2} />
              <h2>Логи не найдены</h2>
              <p>Попробуйте изменить фильтры или дождаться новых действий в админке.</p>
            </div>
          )}
        </AdminCard.Content>
      </AdminCard>
    </div>
  );
}
