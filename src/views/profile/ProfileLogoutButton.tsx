"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "@/shared/lib/auth-client";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { useToast } from "@/shared/ui/Toast";

import styles from "./ProfileView.module.css";

type ProfileLogoutButtonProps = {
  isAdmin: boolean;
};

export function ProfileLogoutButton({ isAdmin }: ProfileLogoutButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasError, setHasError] = useState(false);
  const toast = useToast();
  const { t } = useI18n();

  function handleLogout() {
    setHasError(false);

    startTransition(async () => {
      const result = await authClient.signOut();

      if (result.error) {
        setHasError(true);
        toast.error(t("profile.logout.error"), t("profile.logout.errorDescription"));
        return;
      }

      toast.success(t("profile.logout.success"));
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <div className={styles.sidebarFooter}>
      {isAdmin ? (
        <Link
          aria-label={t("profile.logout.adminAria")}
          className={styles.logoutButton}
          data-action="admin"
          href="/admin"
        >
          <LayoutDashboard aria-hidden size={22} strokeWidth={1.9} />
          <span className={styles.logoutDesktopLabel}>{t("profile.logout.adminDesktop")}</span>
          <span className={styles.logoutMobileLabel}>{t("profile.logout.adminMobile")}</span>
        </Link>
      ) : null}

      <button
        aria-describedby={hasError ? "profile-logout-error" : undefined}
        aria-label={isPending ? t("profile.logout.pendingAria") : t("profile.logout.signOutAria")}
        className={styles.logoutButton}
        data-action="logout"
        disabled={isPending}
        onClick={handleLogout}
        type="button"
      >
        <LogOut aria-hidden size={22} strokeWidth={1.9} />
        <span className={styles.logoutDesktopLabel}>
          {isPending ? t("profile.logout.pending") : t("profile.logout.signOut")}
        </span>
      </button>

      {hasError ? (
        <p className={styles.logoutError} id="profile-logout-error">
          {t("profile.logout.error")} {t("profile.logout.errorDescription")}
        </p>
      ) : null}
    </div>
  );
}
