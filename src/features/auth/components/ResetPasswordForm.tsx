"use client";

import type { FormEvent } from "react";
import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useToast } from "@/shared/ui/Toast";

import { resetPasswordSchema } from "../lib/auth-schemas";
import styles from "./ResetPasswordForm.module.css";

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);

    if (message) {
      return message;
    }
  }

  return fallback;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (urlError) {
      toast.error(t("auth.resetPassword.expired"));
    }
  }, [t, toast, urlError]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error(
        t("auth.resetPassword.missingToken"),
        t("auth.resetPassword.missingTokenDescription"),
      );
      return;
    }

    const formData = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("auth.resetPassword.formError"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token,
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.resetPassword.updateError")));
        return;
      }

      toast.success(t("auth.resetPassword.success"), t("auth.resetPassword.successDescription"));
      window.setTimeout(() => router.push("/"), 1200);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="reset-password-title">
        <h1 className={styles.title} id="reset-password-title">
          {t("auth.resetPassword.title")}
        </h1>
        <p className={styles.subtitle}>{t("auth.resetPassword.subtitle")}</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            autoComplete="new-password"
            label={t("profile.settingsPage.account.passwordNew")}
            name="password"
            placeholder={t("auth.resetPassword.passwordPlaceholder")}
            type="password"
          />

          <Input
            autoComplete="new-password"
            label={t("profile.settingsPage.account.passwordRepeat")}
            name="passwordConfirm"
            placeholder={t("auth.resetPassword.repeatPlaceholder")}
            type="password"
          />

          <Button
            className={styles.submit}
            disabled={!token || isPending}
            isLoading={isPending}
            type="submit"
            fullWidth
          >
            {t("auth.resetPassword.submit")}
          </Button>
        </form>
      </section>
    </main>
  );
}
