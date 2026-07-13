"use client";

import type { FormEvent } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { authClient } from "@/shared/lib/auth-client";
import { isPasswordValid } from "@/shared/lib/validation/password";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useToast } from "@/shared/ui/Toast";

import { resetPasswordSchema } from "../lib/auth-schemas";
import { PasswordRequirements } from "./PasswordRequirements";
import styles from "./ResetPasswordForm.module.css";

function getAuthErrorMessage(
  error: unknown,
  fallback: string,
  invalidTokenMessage: string,
  rateLimitMessage: string,
) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    const normalized = message.toLowerCase();

    if (normalized.includes("invalid token") || normalized.includes("token")) {
      return invalidTokenMessage;
    }

    if (normalized.includes("too many") || normalized.includes("rate limit")) {
      return rateLimitMessage;
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
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const toast = useToast();
  const { t } = useI18n();
  const notice = urlError
    ? {
        description: t("auth.resetPassword.updateError"),
        title: t("auth.resetPassword.expired"),
      }
    : !token
      ? {
          description: t("auth.resetPassword.missingTokenDescription"),
          title: t("auth.resetPassword.missingToken"),
        }
      : null;

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
        toast.error(
          getAuthErrorMessage(
            result.error,
            t("auth.resetPassword.updateError"),
            t("auth.resetPassword.invalidToken"),
            t("auth.errors.tooManyRequests"),
          ),
        );
        return;
      }

      toast.success(t("auth.resetPassword.success"), t("auth.resetPassword.successDescription"));
      setIsSuccess(true);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="reset-password-title">
        <h1 className={styles.title} id="reset-password-title">
          {t("auth.resetPassword.title")}
        </h1>
        <p className={styles.subtitle}>{t("auth.resetPassword.subtitle")}</p>
        {notice ? (
          <div className={styles.notice} role="alert">
            <p className={styles.noticeTitle}>{notice.title}</p>
            <p className={styles.noticeDescription}>{notice.description}</p>
          </div>
        ) : null}

        {isSuccess ? (
          <div className={styles.form}>
            <div className={styles.notice} role="status">
              <p className={styles.noticeTitle}>{t("auth.resetPassword.success")}</p>
              <p className={styles.noticeDescription}>
                {t("auth.resetPassword.successDescription")}
              </p>
            </div>
            <Button className={styles.submit} onClick={() => router.push("/")} fullWidth>
              {t("auth.resetPassword.backToHome")}
            </Button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <Input
              autoComplete="new-password"
              disabled={!token}
              label={t("profile.settingsPage.account.passwordNew")}
              name="password"
              placeholder={t("auth.resetPassword.passwordPlaceholder")}
              type="password"
              value={passwordValue}
              onChange={(event) => setPasswordValue(event.currentTarget.value)}
            />

            <PasswordRequirements password={passwordValue} />

            <Input
              autoComplete="new-password"
              disabled={!token}
              label={t("profile.settingsPage.account.passwordRepeat")}
              name="passwordConfirm"
              placeholder={t("auth.resetPassword.repeatPlaceholder")}
              type="password"
            />

            <Button
              className={styles.submit}
              disabled={!token || isPending || !isPasswordValid(passwordValue)}
              isLoading={isPending}
              type="submit"
              fullWidth
            >
              {t("auth.resetPassword.submit")}
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
