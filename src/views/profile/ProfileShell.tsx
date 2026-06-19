"use client";

import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  Heart,
  Home,
  MapPinned,
  Settings,
  Sparkles,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ProfileLogoutButton } from "./ProfileLogoutButton";
import styles from "./ProfileView.module.css";

type ProfileSection = "bookings" | "events" | "home" | "matches" | "settings";

type ProfileShellProps = {
  children: ReactNode;
  firstName: string;
  plannedCount: number;
};

const sidebarItems = [
  { href: "/profile", icon: Home, key: "home", label: "Главная" },
  { href: "/profile/bookings", icon: CalendarCheck, key: "bookings", label: "Мои записи" },
  { href: "/profile/events", icon: MapPinned, key: "events", label: "Мероприятия" },
  { href: "/profile/matches", icon: UsersRound, key: "matches", label: "Мэтчи" },
  { href: "/profile/settings", icon: Settings, key: "settings", label: "Настройки" },
] satisfies Array<{
  href: string;
  icon: LucideIcon;
  key: ProfileSection;
  label: string;
}>;

const notifications = [
  {
    description: "Ваше место на Speed dating 25-35 закреплено. Ждем вас в Hotel Almond.",
    icon: CheckCircle2,
    time: "Сегодня",
    title: "Запись подтверждена",
    tone: "success",
  },
  {
    description: "До события осталось 3 дня. Возьмите документ и приходите за 15 минут.",
    icon: Clock3,
    time: "Вчера",
    title: "Напоминание о встрече",
    tone: "coral",
  },
  {
    description: "Для Speed dating 32-44 ожидается оплата бронирования.",
    icon: CreditCard,
    time: "31 мая",
    title: "Ожидает оплаты",
    tone: "warning",
  },
] satisfies Array<{
  description: string;
  icon: LucideIcon;
  time: string;
  title: string;
  tone: "coral" | "success" | "warning";
}>;

function getActiveSection(pathname: string): ProfileSection {
  if (pathname.startsWith("/profile/bookings")) {
    return "bookings";
  }

  if (pathname.startsWith("/profile/events")) {
    return "events";
  }

  if (pathname.startsWith("/profile/matches")) {
    return "matches";
  }

  if (pathname.startsWith("/profile/settings")) {
    return "settings";
  }

  return "home";
}

function getHeaderCopy(input: { active: ProfileSection; firstName: string; plannedCount: number }) {
  if (input.active === "bookings") {
    return {
      description: "Здесь собраны ваши бронирования",
      title: "Мои записи",
    };
  }

  if (input.active === "matches") {
    return {
      description:
        "Здесь отображаются результаты прошедших мероприятий. Мэтчи появляются только при взаимных симпатиях.",
      title: "Мэтчи",
    };
  }

  if (input.active === "events") {
    return {
      description: "Найдите идеальное мероприятие рядом с вами",
      title: "Мероприятия",
    };
  }

  if (input.active === "settings") {
    return {
      description: "Управляйте аккаунтом, уведомлениями, предпочтениями мероприятий и оплатами.",
      title: "Настройки",
    };
  }

  return {
    description: `Рады видеть вас снова. У вас запланировано ${input.plannedCount} мероприятие.`,
    title: `Привет, ${input.firstName}!`,
  };
}

export function ProfileShell({ children, firstName, plannedCount }: ProfileShellProps) {
  const pathname = usePathname();
  const active = getActiveSection(pathname);
  const headerCopy = useMemo(
    () => getHeaderCopy({ active, firstName, plannedCount }),
    [active, firstName, plannedCount],
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!notificationsRef.current?.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar} aria-label="Навигация профиля">
        <Link className={styles.brand} href="/">
          <span className={styles.brandIcon}>
            <Heart aria-hidden size={29} strokeWidth={2.2} />
          </span>
          <span>SpeedDate</span>
        </Link>

        <nav className={styles.navigation}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.key === active;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={isActive ? styles.navItemActive : styles.navItem}
                href={item.href}
                key={item.label}
                onClick={() => setIsNotificationsOpen(false)}
              >
                <Icon aria-hidden size={22} strokeWidth={1.9} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <ProfileLogoutButton />
      </aside>

      <section className={styles.content}>
        <header className={styles.profileHeader}>
          <div className={styles.profileHeaderText}>
            <h1 className={styles.profileTitle} id="profile-section-title">
              {headerCopy.title}
              {active === "home" ? (
                <Sparkles aria-hidden className={styles.profileTitleIcon} size={31} />
              ) : null}
            </h1>
            <p className={styles.profileSubtitle}>{headerCopy.description}</p>
          </div>

          <div className={styles.headerActions} ref={notificationsRef}>
            <button
              aria-expanded={isNotificationsOpen}
              aria-haspopup="dialog"
              aria-label="Открыть уведомления"
              className={styles.notificationButton}
              onClick={() => setIsNotificationsOpen((value) => !value)}
              type="button"
            >
              <Bell aria-hidden size={22} strokeWidth={2.1} />
              <span className={styles.notificationBadge}>{notifications.length}</span>
            </button>

            {isNotificationsOpen ? (
              <section aria-label="Уведомления" className={styles.notificationsPanel} role="dialog">
                <div className={styles.notificationsHeader}>
                  <div>
                    <h2>Уведомления</h2>
                    <p>Все важные обновления по вашим событиям</p>
                  </div>
                  <span>{notifications.length}</span>
                </div>

                <div className={styles.notificationsList}>
                  {notifications.map((notification) => {
                    const Icon = notification.icon;

                    return (
                      <article className={styles.notificationItem} key={notification.title}>
                        <span className={styles.notificationIcon} data-tone={notification.tone}>
                          <Icon aria-hidden size={19} strokeWidth={2.1} />
                        </span>
                        <div>
                          <div className={styles.notificationTitleRow}>
                            <h3>{notification.title}</h3>
                            <time>{notification.time}</time>
                          </div>
                          <p>{notification.description}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </header>

        <div className={styles.profileBody}>{children}</div>
      </section>
    </main>
  );
}
