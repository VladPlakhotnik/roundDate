"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "@/shared/lib/auth-client";
import { useToast } from "@/shared/ui/Toast";

import styles from "./ProfileView.module.css";

export function ProfileLogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasError, setHasError] = useState(false);
  const toast = useToast();

  function handleLogout() {
    setHasError(false);

    startTransition(async () => {
      const result = await authClient.signOut();

      if (result.error) {
        setHasError(true);
        toast.error("Не удалось выйти.", "Попробуйте еще раз.");
        return;
      }

      toast.success("Вы вышли из аккаунта.");
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <div className={styles.sidebarFooter}>
      <button
        aria-describedby={hasError ? "profile-logout-error" : undefined}
        className={styles.logoutButton}
        disabled={isPending}
        onClick={handleLogout}
        type="button"
      >
        <LogOut aria-hidden size={22} strokeWidth={1.9} />
        <span>{isPending ? "Выходим..." : "Выйти"}</span>
      </button>

      {hasError ? (
        <p className={styles.logoutError} id="profile-logout-error">
          Не удалось выйти. Попробуйте ещё раз.
        </p>
      ) : null}
    </div>
  );
}
