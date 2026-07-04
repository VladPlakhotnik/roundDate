import "server-only";

import { revalidatePath } from "next/cache";
import { asc, eq, ilike, inArray } from "drizzle-orm";

import { requireSuperAdmin } from "@/admin/auth/require-admin";
import { recordAdminAuditLog } from "@/admin/server/audit-logs";
import { emailSchema } from "@/shared/lib/validation/contact";
import { getDb } from "@/shared/server/db/client";
import { authSessions, authUsers, profiles } from "@/shared/server/db/schema";
import type { AppRole } from "@/shared/types";

export type AdminTeamRole = Extract<AppRole, "admin" | "manager">;

export type AdminTeamMember = {
  banned: boolean;
  createdAt: Date;
  email: string;
  firstName: string | null;
  id: string;
  image: string | null;
  lastName: string | null;
  name: string;
  phone: string | null;
  role: AdminTeamRole;
  updatedAt: Date;
};

export type AdminTeamPageData = {
  adminsCount: number;
  currentAdminId: string;
  managersCount: number;
  members: AdminTeamMember[];
  total: number;
};

export type AdminTeamActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

type InviteInput = {
  email: unknown;
  role: unknown;
};

const teamRoles = ["admin", "manager"] as const;

export const initialAdminTeamActionState: AdminTeamActionState = {
  message: "",
  status: "idle",
};

export function normalizeTeamRole(value: unknown): AdminTeamRole {
  return value === "admin" ? "admin" : "manager";
}

export function normalizeTeamInviteInput(input: InviteInput) {
  const email = emailSchema.safeParse(input.email);

  return {
    email: email.success ? email.data : "",
    role: normalizeTeamRole(input.role),
  };
}

export function canChangeTeamMemberRole(input: {
  actorId: string;
  nextRole: AdminTeamRole;
  targetId: string;
}) {
  return input.actorId !== input.targetId || input.nextRole === "admin";
}

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getTeamActionSuccess(message: string): AdminTeamActionState {
  return {
    message,
    status: "success",
  };
}

function getTeamActionError(message: string): AdminTeamActionState {
  return {
    message,
    status: "error",
  };
}

function revalidateAdminTeam() {
  revalidatePath("/admin/team");
  revalidatePath("/admin/users");
  revalidatePath("/admin/events");
}

async function revokeUserSessions(userId: string) {
  await getDb().delete(authSessions).where(eq(authSessions.userId, userId));
}

async function getTeamUserById(userId: string) {
  const [user] = await getDb()
    .select({
      banned: authUsers.banned,
      email: authUsers.email,
      id: authUsers.id,
      name: authUsers.name,
      role: authUsers.role,
    })
    .from(authUsers)
    .where(eq(authUsers.id, userId))
    .limit(1);

  return user;
}

export async function getAdminTeamPageData(): Promise<AdminTeamPageData> {
  const admin = await requireSuperAdmin();
  const members = await getDb()
    .select({
      banned: authUsers.banned,
      createdAt: authUsers.createdAt,
      email: authUsers.email,
      firstName: profiles.firstName,
      id: authUsers.id,
      image: authUsers.image,
      lastName: profiles.lastName,
      name: authUsers.name,
      phone: profiles.phone,
      role: authUsers.role,
      updatedAt: authUsers.updatedAt,
    })
    .from(authUsers)
    .leftJoin(profiles, eq(profiles.userId, authUsers.id))
    .where(inArray(authUsers.role, teamRoles))
    .orderBy(asc(authUsers.name));

  const teamMembers = members.filter((member): member is AdminTeamMember =>
    teamRoles.includes(member.role as AdminTeamRole),
  );

  return {
    adminsCount: teamMembers.filter((member) => member.role === "admin").length,
    currentAdminId: admin.id,
    managersCount: teamMembers.filter((member) => member.role === "manager").length,
    members: teamMembers,
    total: teamMembers.length,
  };
}

export async function inviteAdminTeamMemberAction(
  _state: AdminTeamActionState,
  formData: FormData,
): Promise<AdminTeamActionState> {
  "use server";

  const admin = await requireSuperAdmin();
  const input = normalizeTeamInviteInput({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!input.email) {
    return getTeamActionError("Введите корректный email.");
  }

  const [user] = await getDb()
    .select({
      email: authUsers.email,
      id: authUsers.id,
      name: authUsers.name,
      role: authUsers.role,
    })
    .from(authUsers)
    .where(ilike(authUsers.email, input.email))
    .limit(1);

  if (!user) {
    return getTeamActionError("Пользователь с таким email еще не зарегистрирован.");
  }

  if (!canChangeTeamMemberRole({ actorId: admin.id, nextRole: input.role, targetId: user.id })) {
    return getTeamActionError("Нельзя снять admin-доступ со своего аккаунта.");
  }

  await getDb()
    .update(authUsers)
    .set({
      role: input.role,
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, user.id));

  if (user.id !== admin.id && user.role !== input.role) {
    await revokeUserSessions(user.id);
  }

  await recordAdminAuditLog({
    action: "team.member_role_updated",
    actor: admin,
    entityId: user.id,
    entityType: "user",
    metadata: {
      email: user.email,
      nextRole: input.role,
      previousRole: user.role,
    },
    summary: `Обновлена роль в команде: ${user.email} -> ${input.role}`,
  });

  revalidateAdminTeam();

  return getTeamActionSuccess(
    input.role === "admin" ? "Пользователь получил роль админа." : "Пользователь стал менеджером.",
  );
}

export async function updateAdminTeamRoleAction(formData: FormData) {
  "use server";

  const admin = await requireSuperAdmin();
  const userId = readString(formData, "userId");
  const nextRole = normalizeTeamRole(formData.get("role"));

  if (!userId) {
    revalidateAdminTeam();
    return;
  }

  if (!canChangeTeamMemberRole({ actorId: admin.id, nextRole, targetId: userId })) {
    revalidateAdminTeam();
    return;
  }

  const user = await getTeamUserById(userId);

  if (!user) {
    revalidateAdminTeam();
    return;
  }

  await getDb()
    .update(authUsers)
    .set({
      role: nextRole,
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, userId));

  if (userId !== admin.id && user.role !== nextRole) {
    await revokeUserSessions(userId);
  }

  await recordAdminAuditLog({
    action: "team.member_role_updated",
    actor: admin,
    entityId: userId,
    entityType: "user",
    metadata: {
      email: user.email,
      nextRole,
      previousRole: user.role,
    },
    summary: `Изменена роль сотрудника: ${user.email} -> ${nextRole}`,
  });

  revalidateAdminTeam();
}

export async function removeAdminTeamMemberAction(formData: FormData) {
  "use server";

  const admin = await requireSuperAdmin();
  const userId = readString(formData, "userId");

  if (!userId || userId === admin.id) {
    revalidateAdminTeam();
    return;
  }

  const user = await getTeamUserById(userId);

  if (!user || !teamRoles.includes(user.role as AdminTeamRole)) {
    revalidateAdminTeam();
    return;
  }

  await getDb()
    .update(authUsers)
    .set({
      role: "user",
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, userId));
  await revokeUserSessions(userId);

  await recordAdminAuditLog({
    action: "team.member_removed",
    actor: admin,
    entityId: userId,
    entityType: "user",
    metadata: {
      email: user.email,
      previousRole: user.role,
    },
    summary: `Пользователь удален из команды: ${user.email}`,
  });

  revalidateAdminTeam();
}

export async function banAdminTeamMemberAction(formData: FormData) {
  "use server";

  const admin = await requireSuperAdmin();
  const userId = readString(formData, "userId");

  if (!userId || userId === admin.id) {
    revalidateAdminTeam();
    return;
  }

  const user = await getTeamUserById(userId);

  if (!user) {
    revalidateAdminTeam();
    return;
  }

  await getDb()
    .update(authUsers)
    .set({
      banExpires: null,
      banReason: "Заблокирован администратором",
      banned: true,
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, userId));
  await revokeUserSessions(userId);

  await recordAdminAuditLog({
    action: "team.member_banned",
    actor: admin,
    entityId: userId,
    entityType: "user",
    metadata: {
      email: user.email,
      role: user.role,
    },
    summary: `Сотрудник заблокирован: ${user.email}`,
  });

  revalidateAdminTeam();
}

export async function unbanAdminTeamMemberAction(formData: FormData) {
  "use server";

  const admin = await requireSuperAdmin();
  const userId = readString(formData, "userId");

  if (!userId) {
    revalidateAdminTeam();
    return;
  }

  const user = await getTeamUserById(userId);

  if (!user) {
    revalidateAdminTeam();
    return;
  }

  await getDb()
    .update(authUsers)
    .set({
      banExpires: null,
      banReason: null,
      banned: false,
      updatedAt: new Date(),
    })
    .where(eq(authUsers.id, userId));

  await recordAdminAuditLog({
    action: "team.member_unbanned",
    actor: admin,
    entityId: userId,
    entityType: "user",
    metadata: {
      email: user.email,
      role: user.role,
    },
    summary: `Сотрудник разблокирован: ${user.email}`,
  });

  revalidateAdminTeam();
}
