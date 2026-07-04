"use client";

import { useActionState, useState } from "react";
import { Ban, RotateCcw, Save, ShieldCheck, ShieldPlus, UserMinus, UsersRound } from "lucide-react";

import { AdminCard } from "@/admin/components/AdminCard";
import { AdminBadge } from "@/admin/components/AdminBadge";
import { AdminTable } from "@/admin/components/AdminTable";
import type {
  AdminTeamActionState,
  AdminTeamMember,
  AdminTeamPageData,
  AdminTeamRole,
} from "@/admin/server/team";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Select } from "@/shared/ui/Select";

import styles from "./AdminTeamView.module.css";

type AdminTeamViewProps = {
  banMemberAction: (formData: FormData) => Promise<void>;
  data: AdminTeamPageData;
  inviteMemberAction: (
    state: AdminTeamActionState,
    formData: FormData,
  ) => Promise<AdminTeamActionState>;
  removeMemberAction: (formData: FormData) => Promise<void>;
  unbanMemberAction: (formData: FormData) => Promise<void>;
  updateRoleAction: (formData: FormData) => Promise<void>;
};

type UpdateRoleAction = (formData: FormData) => Promise<void>;

const roleOptions = [
  { label: "Менеджер", value: "manager" },
  { label: "Админ", value: "admin" },
] satisfies Array<{ label: string; value: AdminTeamRole }>;

const initialInviteState: AdminTeamActionState = {
  message: "",
  status: "idle",
};

const roleLabels = {
  admin: "Админ",
  manager: "Менеджер",
} satisfies Record<AdminTeamRole, string>;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDisplayName(member: AdminTeamMember) {
  return (
    [member.firstName, member.lastName].filter(Boolean).join(" ") || member.name || member.email
  );
}

function getInitials(member: AdminTeamMember) {
  const name = getDisplayName(member);
  const [first = "", second = ""] = name.split(/\s+/);

  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase() || "RD";
}

function toTeamRole(value: string): AdminTeamRole {
  return value === "admin" ? "admin" : "manager";
}

function TeamMemberRoleForm({
  isSelf,
  member,
  updateRoleAction,
}: {
  isSelf: boolean;
  member: AdminTeamMember;
  updateRoleAction: UpdateRoleAction;
}) {
  const [role, setRole] = useState<AdminTeamRole>(member.role);

  return (
    <form action={updateRoleAction} className={styles.roleForm}>
      <input name="userId" type="hidden" value={member.id} />
      <Select
        disabled={isSelf}
        name="role"
        options={roleOptions}
        size="sm"
        value={role}
        onChange={(value) => setRole(toTeamRole(value))}
      />
      <Button
        aria-label={`Сохранить роль ${getDisplayName(member)}`}
        disabled={isSelf}
        size="icon"
        title={isSelf ? "Это ваш аккаунт" : "Сохранить роль"}
        type="submit"
        variant="outline"
      >
        <Save aria-hidden size={16} strokeWidth={2.3} />
      </Button>
    </form>
  );
}

export function AdminTeamView({
  banMemberAction,
  data,
  inviteMemberAction,
  removeMemberAction,
  unbanMemberAction,
  updateRoleAction,
}: AdminTeamViewProps) {
  const [inviteState, inviteFormAction, isInvitePending] = useActionState(
    inviteMemberAction,
    initialInviteState,
  );
  const [inviteRole, setInviteRole] = useState<AdminTeamRole>("manager");

  return (
    <div className={styles.teamPage}>
      <AdminCard className={styles.headerCard}>
        <AdminCard.Content className={styles.header}>
          <div>
            <AdminBadge size="sm" tone="neutral">
              Super admin
            </AdminBadge>
            <h1>Команда</h1>
            <p>
              Управляйте сотрудниками админки, ролями доступа и блокировками служебных аккаунтов.
            </p>
          </div>
          <span className={styles.headerIcon}>
            <ShieldPlus aria-hidden size={30} strokeWidth={2.1} />
          </span>
        </AdminCard.Content>
      </AdminCard>

      <section className={styles.summaryGrid} aria-label="Сводка по команде">
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span>
              <UsersRound aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Всего</small>
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
              <small>Админы</small>
              <strong>{data.adminsCount}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
        <AdminCard>
          <AdminCard.Content className={styles.summaryCard}>
            <span data-tone="manager">
              <ShieldPlus aria-hidden size={19} strokeWidth={2.2} />
            </span>
            <div>
              <small>Менеджеры</small>
              <strong>{data.managersCount}</strong>
            </div>
          </AdminCard.Content>
        </AdminCard>
      </section>

      <AdminCard>
        <AdminCard.Content>
          <form action={inviteFormAction} className={styles.inviteForm}>
            <Input
              label="Email пользователя"
              name="email"
              placeholder="manager@example.com"
              required
              size="sm"
              type="email"
            />
            <Select
              label="Роль"
              name="role"
              options={roleOptions}
              size="sm"
              value={inviteRole}
              onChange={(value) => setInviteRole(toTeamRole(value))}
            />
            <Button disabled={isInvitePending} isLoading={isInvitePending} size="sm" type="submit">
              Добавить
            </Button>
          </form>
          {inviteState.message ? (
            <p
              className={styles.actionMessage}
              data-status={inviteState.status}
              role={inviteState.status === "error" ? "alert" : "status"}
            >
              {inviteState.message}
            </p>
          ) : null}
        </AdminCard.Content>
      </AdminCard>

      <AdminCard>
        <AdminCard.Content>
          <AdminTable.ScrollContainer>
            <AdminTable aria-label="Сотрудники админки">
              <AdminTable.Header>
                <AdminTable.Row>
                  <AdminTable.Column isRowHeader>Сотрудник</AdminTable.Column>
                  <AdminTable.Column>Роль</AdminTable.Column>
                  <AdminTable.Column>Статус</AdminTable.Column>
                  <AdminTable.Column>Обновлен</AdminTable.Column>
                  <AdminTable.Column>
                    <span className={styles.srOnly}>Действия</span>
                  </AdminTable.Column>
                </AdminTable.Row>
              </AdminTable.Header>
              <AdminTable.Body>
                {data.members.map((member) => {
                  const isSelf = member.id === data.currentAdminId;

                  return (
                    <AdminTable.Row id={member.id} key={member.id}>
                      <AdminTable.Cell>
                        <div className={styles.memberCell}>
                          {member.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt="" src={member.image} />
                          ) : (
                            <span>{getInitials(member)}</span>
                          )}
                          <div>
                            <strong>{getDisplayName(member)}</strong>
                            <small>{member.email}</small>
                            {member.phone ? <small>{member.phone}</small> : null}
                          </div>
                        </div>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <TeamMemberRoleForm
                          isSelf={isSelf}
                          member={member}
                          updateRoleAction={updateRoleAction}
                        />
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <AdminBadge size="sm" tone={member.role === "admin" ? "info" : "warning"}>
                          {roleLabels[member.role]}
                        </AdminBadge>
                        <AdminBadge size="sm" tone={member.banned ? "danger" : "success"}>
                          {member.banned ? "Заблокирован" : "Активен"}
                        </AdminBadge>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <time className={styles.dateText} dateTime={member.updatedAt.toISOString()}>
                          {formatDate(member.updatedAt)}
                        </time>
                      </AdminTable.Cell>
                      <AdminTable.Cell>
                        <div className={styles.actionsCell}>
                          <form action={member.banned ? unbanMemberAction : banMemberAction}>
                            <input name="userId" type="hidden" value={member.id} />
                            <Button
                              aria-label={
                                member.banned
                                  ? `Разблокировать ${getDisplayName(member)}`
                                  : `Заблокировать ${getDisplayName(member)}`
                              }
                              disabled={isSelf}
                              size="icon"
                              title={
                                isSelf
                                  ? "Это ваш аккаунт"
                                  : member.banned
                                    ? "Разблокировать"
                                    : "Заблокировать"
                              }
                              type="submit"
                              variant={member.banned ? "outline" : "soft"}
                            >
                              {member.banned ? (
                                <RotateCcw aria-hidden size={16} strokeWidth={2.3} />
                              ) : (
                                <Ban aria-hidden size={16} strokeWidth={2.3} />
                              )}
                            </Button>
                          </form>
                          <form action={removeMemberAction}>
                            <input name="userId" type="hidden" value={member.id} />
                            <Button
                              aria-label={`Удалить из команды ${getDisplayName(member)}`}
                              disabled={isSelf}
                              size="icon"
                              title={isSelf ? "Это ваш аккаунт" : "Удалить из команды"}
                              type="submit"
                              variant="outline"
                            >
                              <UserMinus aria-hidden size={16} strokeWidth={2.3} />
                            </Button>
                          </form>
                        </div>
                      </AdminTable.Cell>
                    </AdminTable.Row>
                  );
                })}
              </AdminTable.Body>
            </AdminTable>
          </AdminTable.ScrollContainer>
        </AdminCard.Content>
      </AdminCard>
    </div>
  );
}
