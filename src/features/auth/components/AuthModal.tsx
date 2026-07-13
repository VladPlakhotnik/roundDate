"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";

import { authClient } from "@/shared/lib/auth-client";
import { isPasswordValid } from "@/shared/lib/validation/password";
import { useI18n } from "@/shared/i18n/I18nProvider";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { GoogleLogo } from "@/shared/ui/SocialLogo";
import { useToast } from "@/shared/ui/Toast";
import { trackAnalyticsEvent } from "@/shared/analytics/track";

import { forgotPasswordSchema, loginSchema, registerSchema } from "../lib/auth-schemas";
import type { AuthMode } from "../types/auth-mode";
import styles from "./AuthModal.module.css";
import { PasswordRequirements } from "./PasswordRequirements";

type AuthModalProps = {
  trigger?: ReactNode;
};

type AuthFeedback = {
  email: string;
  type: "forgot-password" | "register";
};

function getAuthErrorMessage(error: unknown, fallback: string, t: (key: string) => string) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);
    const normalized = message.toLowerCase();

    if (normalized.includes("email not verified")) {
      return t("auth.errors.emailNotVerified");
    }

    if (normalized.includes("too many") || normalized.includes("rate limit")) {
      return t("auth.errors.tooManyRequests");
    }

    if (
      normalized.includes("invalid email or password") ||
      normalized.includes("invalid password") ||
      normalized.includes("invalid credentials")
    ) {
      return t("auth.errors.invalidCredentials");
    }
  }

  return fallback;
}

export function AuthModal({ trigger }: AuthModalProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");
  const [feedback, setFeedback] = useState<AuthFeedback | null>(null);
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
    setFeedback(null);
    setShowPassword(false);
    setPasswordValue("");
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (!open) {
      setPasswordValue("");
      setShowPassword(false);
      setFeedback(null);
    }
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
      trackAnalyticsEvent("auth_email_submit", {
        mode: "login",
      });

      const result = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/profile",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default"), t));
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
      trackAnalyticsEvent("auth_email_submit", {
        mode: "register",
      });

      const result = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/onboarding",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default"), t));
        return;
      }

      setFeedback({ email: parsed.data.email, type: "register" });
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
      trackAnalyticsEvent("auth_password_reset_request");

      const result = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default"), t));
        return;
      }

      setFeedback({ email: parsed.data.email, type: "forgot-password" });
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
      trackAnalyticsEvent("auth_social_click", {
        provider,
      });

      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/profile",
        newUserCallbackURL: "/onboarding",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error, t("auth.errors.default"), t));
      }
    });
  }

  const feedbackTitle =
    feedback?.type === "register"
      ? t("auth.toasts.registerSuccess")
      : t("auth.toasts.forgotPasswordTitle");
  const feedbackDescription =
    feedback?.type === "register"
      ? t("auth.toasts.registerSuccessDescription")
      : t("auth.toasts.forgotPassword");

  return (
    <Modal
      onOpenChange={handleOpenChange}
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
            src="/assets/auth/auth-visual-v3.webp"
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

          {feedback ? (
            <div className={styles.feedbackPanel} role="status">
              <div className={styles.feedbackIcon} aria-hidden>
                <Check aria-hidden size={30} strokeWidth={3} />
              </div>
              <div>
                <h3>{feedbackTitle}</h3>
                <p>{feedbackDescription}</p>
                <p className={styles.feedbackEmail}>{feedback.email}</p>
              </div>
              <Button className={styles.submit} onClick={() => switchMode("login")}>
                {t("auth.submit.login")}
              </Button>
              <button
                className={styles.linkButton}
                onClick={() => switchMode(feedback.type)}
                type="button"
              >
                {t("auth.feedback.useAnotherEmail")}
              </button>
            </div>
          ) : (
            <>
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
                          showPassword
                            ? t("auth.togglePassword.hide")
                            : t("auth.togglePassword.show")
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
                    value={passwordValue}
                    onChange={(event) => setPasswordValue(event.currentTarget.value)}
                  />
                ) : null}

                {mode === "register" ? <PasswordRequirements password={passwordValue} /> : null}

                <Button
                  className={styles.submit}
                  disabled={isPending || (mode === "register" && !isPasswordValid(passwordValue))}
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
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}
