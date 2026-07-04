"use client";

import { useEffect, useRef, useState } from "react";
import {
  Ban,
  Info,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge } from "@/admin/components/AdminBadge";
import { AdminColumnVisibility } from "@/admin/components/AdminColumnVisibility";
import { AdminTable } from "@/admin/components/AdminTable";
import { getDefaultVisibleAdminColumnIds } from "@/admin/lib/default-visible-columns";
import type { AdminUserFilters, AdminUserListItem, AdminUsersPageData } from "@/admin/server/users";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

import styles from "./AdminUsersView.module.css";

type AdminUsersViewProps = {
  banUserAction: (formData: FormData) => Promise<void>;
  data: AdminUsersPageData;
  filters: AdminUserFilters;
  unbanUserAction: (formData: FormData) => Promise<void>;
};

const userTableColumns = [
  { id: "user", label: "Пользователь" },
  { id: "role", label: "Роль" },
  { id: "status", label: "Статус" },
  { id: "profile", label: "Профиль" },
  { id: "created", label: "Создан" },
  { id: "actions", label: "Действия" },
] as const;

type UserTableColumnId = (typeof userTableColumns)[number]["id"];
const defaultUserTableColumnIds = getDefaultVisibleAdminColumnIds(userTableColumns, [
  "status",
  "profile",
]);
const userTableColumnStorageKey = "admin.users.table.columns";

const roleLabels = {
  admin: "Админ",
  manager: "Менеджер",
  user: "Пользователь",
} satisfies Record<AdminUserListItem["role"], string>;

const roleTones = {
  admin: "info",
  manager: "warning",
  user: "neutral",
} satisfies Record<AdminUserListItem["role"], "info" | "neutral" | "warning">;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getInitials(user: AdminUserListItem) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || user.email;
  const [first = "", second = ""] = name.split(" ");

  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase() || "U";
}

function getDisplayName(user: AdminUserListItem) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.name || "Без имени";
}

function getProfileDetails(user: AdminUserListItem) {
  const details = [];

  if (user.phone) {
    details.push(user.phone);
  }

  if (user.gender) {
    details.push(user.gender);
  }

  return details.length > 0 ? details.join(" · ") : "Профиль пока не заполнен";
}

export function AdminUsersView({
  banUserAction,
  data,
  filters,
  unbanUserAction,
}: AdminUsersViewProps) {
  const pathname = usePathname();
  const router = useRouter();
  const hasMountedRef = useRef(false);
  const [query, setQuery] = useState(filters.q);
  const debouncedQuery = useDebounce(query, 320);
  const [role, setRole] = useState(filters.role);
  const [status, setStatus] = useState(filters.status);
  const [visibleUserColumnIds, setVisibleUserColumnIds] = useState<string[]>(() => [
    ...defaultUserTableColumnIds,
  ]);
  const hasFilters = Boolean(filters.q || filters.role !== "all" || filters.status !== "all");
  const visibleBanned = data.users.filter((user) => user.banned).length;
  const visibleStaff = data.users.filter(
    (user) => user.role === "admin" || user.role === "manager",
  ).length;
  const visibleUserColumnSet = new Set(visibleUserColumnIds);

  function isUserColumnVisible(columnId: UserTableColumnId) {
    return visibleUserColumnSet.has(columnId);
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

    if (role !== "all") {
      params.set("role", role);
    }

    if (status !== "all") {
      params.set("status", status);
    }

    const nextUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [debouncedQuery, pathname, role, router, status]);

  return (
    <div className={styles.usersPage}>
      <AdminCard className={styles.headerCard}>
        <AdminCard.Content className={styles.header}>
          <div>
            <AdminBadge size="sm" tone="neutral">
              Admin workspace
            </AdminBadge>
            <h1>Пользователи</h1>
            <p>
              Управляйте аккаунтами, проверяйте базовые данные, ищите пользователей и быстро
              блокируйте доступ при необходимости.
            </p>
          </div>
          <span className={styles.headerIcon}>
            <UsersRound aria-hidden size={30} strokeWidth={2.1} />
          </span>
        </AdminCard.Content>
      </AdminCard>

      <section className={styles.summaryGrid} aria-label="Сводка по пользователям">
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span>
              <UsersRound aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Найдено</small>
              <strong>{data.total}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="admin">
              <ShieldCheck aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Команда в выдаче</small>
              <strong>{visibleStaff}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="banned">
              <Ban aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Заблокированы</small>
              <strong>{visibleBanned}</strong>
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
              placeholder="Имя, email или телефон"
              size="sm"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
            />

            <Select
              label="Роль"
              name="role"
              options={[
                { label: "Все роли", value: "all" },
                { label: "Пользователи", value: "user" },
                { label: "Менеджеры", value: "manager" },
                { label: "Админы", value: "admin" },
              ]}
              size="sm"
              value={role}
              onChange={(value) => setRole(value as typeof role)}
            />

            <Select
              label="Статус"
              name="status"
              options={[
                { label: "Все статусы", value: "all" },
                { label: "Активные", value: "active" },
                { label: "Заблокированные", value: "banned" },
              ]}
              size="sm"
              value={status}
              onChange={(value) => setStatus(value as typeof status)}
            />

            <AdminColumnVisibility
              columns={userTableColumns}
              storageKey={userTableColumnStorageKey}
              visibleColumnIds={visibleUserColumnIds}
              onVisibleColumnIdsChange={setVisibleUserColumnIds}
            />
            {hasFilters ? (
              <Link className={styles.resetLink} href="/admin/users">
                <RotateCcw aria-hidden size={16} strokeWidth={2.3} />
                Сбросить
              </Link>
            ) : null}
          </div>
        </AdminCard.Content>
      </AdminCard>

      <AdminCard>
        <AdminCard.Content>
          {data.users.length > 0 ? (
            <>
              <AdminTable.ScrollContainer>
                <AdminTable aria-label="Список пользователей">
                  <AdminTable.Header>
                    <AdminTable.Row>
                      {isUserColumnVisible("user") ? (
                        <AdminTable.Column isRowHeader>Пользователь</AdminTable.Column>
                      ) : null}
                      {isUserColumnVisible("role") ? (
                        <AdminTable.Column>Роль</AdminTable.Column>
                      ) : null}
                      {isUserColumnVisible("status") ? (
                        <AdminTable.Column>Статус</AdminTable.Column>
                      ) : null}
                      {isUserColumnVisible("profile") ? (
                        <AdminTable.Column>Профиль</AdminTable.Column>
                      ) : null}
                      {isUserColumnVisible("created") ? (
                        <AdminTable.Column>Создан</AdminTable.Column>
                      ) : null}
                      {isUserColumnVisible("actions") ? (
                        <AdminTable.Column>
                          <span className={styles.srOnly}>Действия</span>
                        </AdminTable.Column>
                      ) : null}
                    </AdminTable.Row>
                  </AdminTable.Header>
                  <AdminTable.Body>
                    {data.users.map((user) => {
                      const isSelf = user.id === data.currentAdminId;

                      return (
                        <AdminTable.Row id={user.id} key={user.id}>
                          {isUserColumnVisible("user") ? (
                            <AdminTable.Cell>
                              <div className={styles.userCell}>
                                {user.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img alt="" src={user.image} />
                                ) : (
                                  <span>{getInitials(user)}</span>
                                )}
                                <div>
                                  <strong>{getDisplayName(user)}</strong>
                                  <small>{user.email}</small>
                                </div>
                              </div>
                            </AdminTable.Cell>
                          ) : null}
                          {isUserColumnVisible("role") ? (
                            <AdminTable.Cell>
                              <AdminBadge size="sm" tone={roleTones[user.role]}>
                                {roleLabels[user.role]}
                              </AdminBadge>
                            </AdminTable.Cell>
                          ) : null}
                          {isUserColumnVisible("status") ? (
                            <AdminTable.Cell>
                              <AdminBadge size="sm" tone={user.banned ? "danger" : "success"}>
                                {user.banned ? "Заблокирован" : "Активен"}
                              </AdminBadge>
                              {user.banReason ? (
                                <em className={styles.banReason}>{user.banReason}</em>
                              ) : null}
                            </AdminTable.Cell>
                          ) : null}
                          {isUserColumnVisible("profile") ? (
                            <AdminTable.Cell>
                              <span className={styles.profileText}>{getProfileDetails(user)}</span>
                            </AdminTable.Cell>
                          ) : null}
                          {isUserColumnVisible("created") ? (
                            <AdminTable.Cell>
                              <time
                                className={styles.dateText}
                                dateTime={user.createdAt.toISOString()}
                              >
                                {formatDate(user.createdAt)}
                              </time>
                            </AdminTable.Cell>
                          ) : null}
                          {isUserColumnVisible("actions") ? (
                            <AdminTable.Cell>
                              <div className={styles.actionsCell}>
                                <Button
                                  aria-label={`Открыть профиль ${getDisplayName(user)}`}
                                  as="link"
                                  href={`/admin/users/${user.id}`}
                                  size="icon"
                                  title="Подробнее"
                                  variant="outline"
                                >
                                  <Info aria-hidden size={17} strokeWidth={2.3} />
                                </Button>
                                <form action={user.banned ? unbanUserAction : banUserAction}>
                                  <input name="userId" type="hidden" value={user.id} />
                                  <Button
                                    aria-label={
                                      isSelf
                                        ? "Нельзя заблокировать свой аккаунт"
                                        : user.banned
                                          ? `Разблокировать ${getDisplayName(user)}`
                                          : `Заблокировать ${getDisplayName(user)}`
                                    }
                                    disabled={isSelf}
                                    size="icon"
                                    title={
                                      isSelf
                                        ? "Это ваш аккаунт"
                                        : user.banned
                                          ? "Разблокировать"
                                          : "Заблокировать"
                                    }
                                    type="submit"
                                    variant={user.banned ? "outline" : "soft"}
                                  >
                                    {isSelf ? (
                                      <UserRoundCheck aria-hidden size={17} strokeWidth={2.3} />
                                    ) : user.banned ? (
                                      <RotateCcw aria-hidden size={17} strokeWidth={2.3} />
                                    ) : (
                                      <Ban aria-hidden size={17} strokeWidth={2.3} />
                                    )}
                                  </Button>
                                </form>
                              </div>
                            </AdminTable.Cell>
                          ) : null}
                        </AdminTable.Row>
                      );
                    })}
                  </AdminTable.Body>
                </AdminTable>
              </AdminTable.ScrollContainer>
            </>
          ) : (
            <div className={styles.emptyState}>
              <UsersRound aria-hidden size={32} strokeWidth={2} />
              <h2>Пользователи не найдены</h2>
              <p>Попробуйте изменить запрос, выбрать другой статус или сбросить фильтры.</p>
              <Link href="/admin/users">Сбросить фильтры</Link>
            </div>
          )}
        </AdminCard.Content>
      </AdminCard>
    </div>
  );
}
