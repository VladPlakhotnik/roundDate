import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth } from "@/shared/server/auth/auth";

type AdminUser = {
  email: string;
  id: string;
  image?: string | null;
  name?: string | null;
  role?: string | null;
};

export type AdminAccessRole = "admin" | "manager";

function isAdminAccessRole(role: string | null | undefined): role is AdminAccessRole {
  return role === "admin" || role === "manager";
}

export async function requireAdmin() {
  const requestHeaders = await headers();
  const session = await getAuth().api.getSession({
    headers: new Headers(requestHeaders),
  });
  const user = session?.user as AdminUser | undefined;

  if (!user) {
    redirect("/");
  }

  if (!isAdminAccessRole(user.role)) {
    redirect("/profile");
  }

  return {
    email: user.email,
    id: user.id,
    image: user.image ?? null,
    name: user.name ?? user.email,
    role: user.role,
  };
}

export async function requireSuperAdmin() {
  const user = await requireAdmin();

  if (user.role !== "admin") {
    redirect("/admin");
  }

  return user;
}
