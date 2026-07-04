"use client";

import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CreditCard,
  HeartHandshake,
  Home,
  LogOut,
  MapPinned,
  ScrollText,
  Send,
  Settings,
  ShieldPlus,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState, useTransition } from "react";

import { AdminBadge } from "@/admin/components/AdminBadge";
import { authClient } from "@/shared/lib/auth-client";
import { BrandLogo } from "@/shared/ui/BrandLogo";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui/Toast";

import styles from "./AdminShell.module.css";

type AdminShellProps = {
  children: ReactNode;
  user: {
    email: string;
    image: string | null;
    name: string;
    role: "admin" | "manager";
  };
};

const navigationItems = [
  { href: "/admin", icon: Home, label: "Обзор" },
  { href: "/admin/events", icon: CalendarDays, label: "Мероприятия" },
  { href: "/admin/addresses", icon: MapPinned, label: "Адреса" },
  { href: "/admin/matches", icon: HeartHandshake, label: "Мэтчи" },
  { href: "/admin/users", icon: UsersRound, label: "Пользователи" },
  { href: "/admin/marketing", icon: Send, label: "Рассылки" },
  { href: "/admin/logs", icon: ScrollText, label: "Логи" },
  { href: "/admin/payments", icon: CreditCard, label: "Оплаты" },
  { href: "/admin/team", icon: ShieldPlus, label: "Команда", adminOnly: true },
  { href: "/admin/settings", icon: Settings, label: "Настройки" },
];

const roleLabel = {
  admin: "Админ",
  manager: "Менеджер",
} satisfies Record<AdminShellProps["user"]["role"], string>;

function getInitials(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const ToggleIcon = isSidebarCollapsed ? ChevronRight : ChevronLeft;

  function handleLogout() {
    startTransition(async () => {
      const result = await authClient.signOut();

      if (result.error) {
        toast.error("Не удалось выйти.", "Попробуйте еще раз.");
        return;
      }

      router.replace("/");
      router.refresh();
    });
  }

  return (
    <main className={styles.page} data-sidebar-collapsed={isSidebarCollapsed}>
      <aside className={styles.sidebar} aria-label="Навигация админ-панели">
        <div className={styles.brandBlock}>
          <Link className={styles.brand} href="/admin" aria-label="RoundDate Admin">
            <BrandLogo showText={!isSidebarCollapsed} size="sm" sublabel="Admin" />
          </Link>
          {isSidebarCollapsed ? null : (
            <AdminBadge className={styles.roleChip} size="sm" tone="neutral">
              {roleLabel[user.role]}
            </AdminBadge>
          )}
        </div>
        <button
          aria-label={isSidebarCollapsed ? "Открыть меню" : "Свернуть меню"}
          aria-pressed={!isSidebarCollapsed}
          className={styles.sidebarToggle}
          title={isSidebarCollapsed ? "Открыть меню" : "Свернуть меню"}
          type="button"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
        >
          <ToggleIcon aria-hidden size={17} strokeWidth={2.6} />
        </button>

        <nav className={styles.navigation}>
          {navigationItems
            .filter((item) => !item.adminOnly || user.role === "admin")
            .map((item) => {
              const Icon = item.icon;
              const isActive = isActivePath(pathname, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  aria-label={item.label}
                  className={isActive ? styles.navItemActive : styles.navItem}
                  href={item.href}
                  key={item.href}
                  title={item.label}
                >
                  <Icon aria-hidden size={19} strokeWidth={2} />
                  {isSidebarCollapsed ? null : <span>{item.label}</span>}
                </Link>
              );
            })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.adminUser}>
            <span className={styles.avatar}>{getInitials(user.name, user.email)}</span>
            {isSidebarCollapsed ? null : (
              <span className={styles.adminUserText}>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
            )}
          </div>

          <Button
            className={styles.logoutButton ?? ""}
            disabled={isPending}
            title={isPending ? "Выходим..." : "Выйти"}
            size="sm"
            variant="ghost"
            onClick={handleLogout}
          >
            <LogOut aria-hidden size={17} strokeWidth={2} />
            {isSidebarCollapsed ? null : (
              <span className={styles.logoutText}>{isPending ? "Выходим..." : "Выйти"}</span>
            )}
          </Button>
        </div>
      </aside>

      <section className={styles.content}>{children}</section>
    </main>
  );
}
