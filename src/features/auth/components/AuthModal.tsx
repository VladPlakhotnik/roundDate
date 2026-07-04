"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";

import { authClient } from "@/shared/lib/auth-client";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { GoogleLogo } from "@/shared/ui/SocialLogo";
import { useToast } from "@/shared/ui/Toast";

import { forgotPasswordSchema, loginSchema, registerSchema } from "../lib/auth-schemas";
import type { AuthMode } from "../types/auth-mode";
import styles from "./AuthModal.module.css";

type AuthModalProps = {
  trigger?: ReactNode;
};

function getAuthErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);

    if (message) {
      return message;
    }
  }

  return fallback;
}

export function AuthModal({ trigger }: AuthModalProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const copy =
    mode === "login"
      ? {
          subtitle: t("auth.login.subtitle"),
          title: t("auth.login.title"),
        }
      : mode === "register"
        ? {
            subtitle: t("auth.register.subtitle"),
            title: t("auth.register.title"),
          }
        : {
            subtitle: t("auth.forgotPassword.subtitle"),
            title: t("auth.forgotPassword.title"),
          };

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setShowPassword(false);
  }

  function handleEmailLogin(formData: FormData) {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("auth.errors.form"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/profile",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default")));
        return;
      }

      toast.success(t("auth.toasts.loginSuccess"));
      setIsOpen(false);
    });
  }

  function handleRegister(formData: FormData) {
    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("auth.errors.form"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/onboarding",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default")));
        return;
      }

      toast.success(t("auth.toasts.registerSuccess"), t("auth.toasts.registerSuccessDescription"));
    });
  }

  function handleForgotPassword(formData: FormData) {
    const parsed = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? t("auth.errors.emailRequired"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default")));
        return;
      }

      toast.success(t("auth.toasts.forgotPasswordTitle"), t("auth.toasts.forgotPassword"));
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (mode === "login") {
      handleEmailLogin(formData);
      return;
    }

    if (mode === "register") {
      handleRegister(formData);
      return;
    }

    handleForgotPassword(formData);
  }

  function handleSocialLogin(provider: "google") {
    startTransition(async () => {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/profile",
        newUserCallbackURL: "/onboarding",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default")));
      }
    });
  }

  return (
    <Modal
      onOpenChange={setIsOpen}
      open={isOpen}
      size="lg"
      title={copy.title}
      trigger={trigger}
      visuallyHiddenTitle
      contentClassName={styles.content}
      mobileFullscreen
    >
      <div className={styles.shell} data-auth-modal-shell data-scroll="off">
        <div className={styles.visual} aria-hidden>
          <Image
            src="/assets/auth/auth-visual-v3.png"
            alt=""
            fill
            priority
            sizes="(max-width: 860px) 0px, 460px"
          />
        </div>

        <section className={styles.panel}>
          <div className={styles.headingBlock}>
            <h2 className={styles.title}>{copy.title}</h2>
            <p className={styles.subtitle}>{copy.subtitle}</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {mode === "register" ? (
              <Input
                autoComplete="given-name"
                label={t("common.form.firstName")}
                name="name"
                placeholder={t("auth.fields.namePlaceholder")}
                size="lg"
              />
            ) : null}

            <Input
              autoComplete="email"
              label={t("common.form.email")}
              name="email"
              placeholder={t("auth.fields.emailPlaceholder")}
              size="lg"
              type="email"
            />

            {mode !== "forgot-password" ? (
              <Input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                label={t("common.form.password")}
                labelAction={
                  mode === "login" ? (
                    <button
                      className={styles.linkButton}
                      onClick={() => switchMode("forgot-password")}
                      type="button"
                    >
                      {t("auth.forgotPasswordLink")}
                    </button>
                  ) : null
                }
                name="password"
                placeholder={t("auth.fields.passwordPlaceholder")}
                rightIcon={
                  <button
                    aria-label={
                      showPassword ? t("auth.togglePassword.hide") : t("auth.togglePassword.show")
                    }
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((value) => !value)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden size={23} />
                    ) : (
                      <Eye aria-hidden size={23} />
                    )}
                  </button>
                }
                size="lg"
                type={showPassword ? "text" : "password"}
              />
            ) : null}

            <Button
              className={styles.submit}
              disabled={isPending}
              isLoading={isPending}
              type="submit"
            >
              {mode === "login"
                ? t("auth.submit.login")
                : mode === "register"
                  ? t("auth.submit.register")
                  : t("auth.submit.forgotPassword")}
            </Button>
          </form>

          {mode !== "forgot-password" ? (
            <>
              <div className={styles.divider}>{t("auth.socialDivider")}</div>
              <div className={styles.socialGrid} data-layout="single">
                <button
                  className={styles.socialButton}
                  disabled={isPending}
                  onClick={() => handleSocialLogin("google")}
                  type="button"
                >
                  <GoogleLogo className={styles.socialIcon} />
                  Google
                </button>
              </div>
            </>
          ) : null}

          <p className={styles.switchText}>
            {mode === "login"
              ? t("auth.switch.login")
              : mode === "register"
                ? t("auth.switch.register")
                : t("auth.switch.forgotPassword")}
            <button
              className={styles.linkButton}
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              type="button"
            >
              {mode === "login" ? t("auth.submit.register") : t("auth.submit.login")}
            </button>
          </p>
        </section>
      </div>
    </Modal>
  );
}
