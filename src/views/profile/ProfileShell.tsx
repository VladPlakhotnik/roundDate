"use client";

import {
  Bell,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  CreditCard,
  HeartHandshake,
  Home,
  MapPinned,
  Settings,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { BrandLogo } from "@/shared/ui/BrandLogo";

import { ProfileLogoutButton } from "./ProfileLogoutButton";
import styles from "./ProfileView.module.css";

type ProfileSection = "bookings" | "events" | "home" | "matches" | "settings";

type ProfileShellProps = {
  children: ReactNode;
  firstName: string;
  isAdmin: boolean;
  plannedCount: number;
};

type ProfileNotification = {
  actionUrl: null | string;
  body: string;
  createdAt: string;
  id: string;
  readAt: null | string;
  title: string;
  tone: "coral" | "info" | "success" | "warning";
  type: string;
};

type NotificationsResponse = {
  notifications: ProfileNotification[];
  unreadCount: number;
};

const sidebarItems = [
  { href: "/profile", icon: Home, key: "home", labelKey: "profile.navigation.home" },
  {
    href: "/profile/bookings",
    icon: CalendarCheck,
    key: "bookings",
    labelKey: "profile.navigation.bookings",
  },
  {
    href: "/profile/events",
    icon: MapPinned,
    key: "events",
    labelKey: "profile.navigation.events",
  },
  {
    href: "/profile/matches",
    icon: HeartHandshake,
    key: "matches",
    labelKey: "profile.navigation.matches",
  },
  {
    href: "/profile/settings",
    icon: Settings,
    key: "settings",
    labelKey: "profile.navigation.settings",
  },
] satisfies Array<{
  href: string;
  icon: LucideIcon;
  key: ProfileSection;
  labelKey: string;
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

function getNotificationIcon(notification: ProfileNotification): LucideIcon {
  if (notification.type.includes("payment")) {
    return CreditCard;
  }

  if (notification.type === "event-reminder") {
    return Clock3;
  }

  if (notification.type === "event-result") {
    return HeartHandshake;
  }

  if (
    notification.type === "new-events" ||
    notification.type === "new-date" ||
    notification.type === "new-events-by-criteria"
  ) {
    return CalendarCheck;
  }

  return CheckCircle2;
}

function formatNotificationTime(input: { locale: string; value: string }) {
  const timestamp = new Date(input.value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);
  const locale = input.locale === "en" ? "en" : "pl";
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(0, "minute");
  }

  if (absSeconds < 60 * 60) {
    return formatter.format(Math.round(diffSeconds / 60), "minute");
  }

  if (absSeconds < 24 * 60 * 60) {
    return formatter.format(Math.round(diffSeconds / (60 * 60)), "hour");
  }

  if (absSeconds < 7 * 24 * 60 * 60) {
    return formatter.format(Math.round(diffSeconds / (24 * 60 * 60)), "day");
  }

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  }).format(new Date(timestamp));
}

function getHeaderCopy(input: {
  active: ProfileSection;
  firstName: string;
  plannedCount: number;
  t: (key: string, values?: Record<string, number | string>) => string;
}) {
  if (input.active === "bookings") {
    return {
      description: input.t("profile.header.bookings.description"),
      title: input.t("profile.header.bookings.title"),
    };
  }

  if (input.active === "matches") {
    return {
      description: input.t("profile.header.matches.description"),
      title: input.t("profile.header.matches.title"),
    };
  }

  if (input.active === "events") {
    return {
      description: input.t("profile.header.events.description"),
      title: input.t("profile.header.events.title"),
    };
  }

  if (input.active === "settings") {
    return {
      description: input.t("profile.header.settings.description"),
      title: input.t("profile.header.settings.title"),
    };
  }

  return {
    description: input.t("profile.header.home.description", { count: input.plannedCount }),
    title: input.t("profile.header.home.title", { name: input.firstName }),
  };
}

export function ProfileShell({ children, firstName, isAdmin, plannedCount }: ProfileShellProps) {
  const { locale, t } = useI18n();
  const pathname = usePathname();
  const active = getActiveSection(pathname);
  const headerCopy = useMemo(
    () => getHeaderCopy({ active, firstName, plannedCount, t }),
    [active, firstName, plannedCount, t],
  );
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ProfileNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    setIsNotificationsLoading(true);

    try {
      const response = await fetch("/api/profile/notifications", {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as NotificationsResponse;

      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } finally {
      setIsNotificationsLoading(false);
    }
  }, []);

  const markNotificationsRead = useCallback(async () => {
    if (unreadCount <= 0) {
      return;
    }

    const readAt = new Date().toISOString();

    setUnreadCount(0);
    setNotifications((items) =>
      items.map((notification) =>
        notification.readAt ? notification : { ...notification, readAt },
      ),
    );

    try {
      await fetch("/api/profile/notifications", {
        method: "PATCH",
      });
    } catch {
      await loadNotifications();
    }
  }, [loadNotifications, unreadCount]);

  const toggleNotifications = useCallback(() => {
    setIsNotificationsOpen((value) => {
      const nextValue = !value;

      if (nextValue) {
        void markNotificationsRead();
      }

      return nextValue;
    });
  }, [markNotificationsRead]);

  function renderNotificationsPanel() {
    return (
      <section
        aria-label={t("profile.notifications.aria")}
        className={styles.notificationsPanel}
        role="dialog"
      >
        <div className={styles.notificationsHeader}>
          <div>
            <h2>{t("profile.notifications.title")}</h2>
            <p>{t("profile.notifications.subtitle")}</p>
          </div>
          <span>{notifications.length}</span>
        </div>

        <div className={styles.notificationsList}>
          {isNotificationsLoading ? (
            <p className={styles.notificationsEmpty}>Ładujemy powiadomienia...</p>
          ) : null}

          {!isNotificationsLoading && notifications.length === 0 ? (
            <p className={styles.notificationsEmpty}>Brak powiadomień.</p>
          ) : null}

          {notifications.map((notification) => {
            const Icon = getNotificationIcon(notification);
            const content = (
              <>
                <span className={styles.notificationIcon} data-tone={notification.tone}>
                  <Icon aria-hidden size={19} strokeWidth={2.1} />
                </span>
                <div>
                  <div className={styles.notificationTitleRow}>
                    <h3>{notification.title}</h3>
                    <time dateTime={notification.createdAt}>
                      {formatNotificationTime({ locale, value: notification.createdAt })}
                    </time>
                  </div>
                  <p>{notification.body}</p>
                </div>
              </>
            );

            return notification.actionUrl ? (
              <Link
                className={styles.notificationItem}
                data-read={notification.readAt ? "true" : "false"}
                href={notification.actionUrl}
                key={notification.id}
                onClick={() => setIsNotificationsOpen(false)}
              >
                {content}
              </Link>
            ) : (
              <article
                className={styles.notificationItem}
                data-read={notification.readAt ? "true" : "false"}
                key={notification.id}
              >
                {content}
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadNotifications();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        !notificationsRef.current?.contains(target) &&
        !mobileNotificationsRef.current?.contains(target)
      ) {
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
      <aside className={styles.sidebar} aria-label={t("profile.navigation.aria")}>
        <Link className={styles.brand} href="/">
          <BrandLogo size="md" />
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
                key={item.key}
                onClick={() => setIsNotificationsOpen(false)}
              >
                <Icon aria-hidden size={22} strokeWidth={1.9} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarMobileActions} ref={mobileNotificationsRef}>
          <button
            aria-expanded={isNotificationsOpen}
            aria-haspopup="dialog"
            aria-label={t("profile.notifications.open")}
            className={styles.notificationButton}
            data-action="notifications"
            onClick={toggleNotifications}
            type="button"
          >
            <Bell aria-hidden size={21} strokeWidth={2.1} />
            {unreadCount > 0 ? (
              <span className={styles.notificationBadge}>{unreadCount}</span>
            ) : null}
          </button>

          {isNotificationsOpen ? renderNotificationsPanel() : null}
        </div>

        <ProfileLogoutButton isAdmin={isAdmin} />
      </aside>

      <section className={styles.content} data-section={active}>
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
              aria-label={t("profile.notifications.open")}
              className={styles.notificationButton}
              onClick={toggleNotifications}
              type="button"
            >
              <Bell aria-hidden size={22} strokeWidth={2.1} />
              {unreadCount > 0 ? (
                <span className={styles.notificationBadge}>{unreadCount}</span>
              ) : null}
            </button>

            {isNotificationsOpen ? renderNotificationsPanel() : null}
          </div>
        </header>

        <div className={styles.profileBody} data-section={active}>
          {children}
        </div>
      </section>
    </main>
  );
}
