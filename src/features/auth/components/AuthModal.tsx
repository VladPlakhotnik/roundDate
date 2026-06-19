"use client";

import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import type { FormEvent, ReactNode } from "react";
import { useState, useTransition } from "react";

import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { FacebookLogo, GoogleLogo } from "@/shared/ui/SocialLogo";
import { useToast } from "@/shared/ui/Toast";

import { forgotPasswordSchema, loginSchema, registerSchema } from "../lib/auth-schemas";
import type { AuthMode } from "../types/auth-mode";
import styles from "./AuthModal.module.css";

type AuthModalProps = {
  trigger?: ReactNode;
};

const modeCopy: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: "Вход в SpeedDate",
    subtitle: "Живые знакомства офлайн",
  },
  register: {
    title: "Регистрация в SpeedDate",
    subtitle: "Создайте аккаунт, чтобы записаться на событие",
  },
  "forgot-password": {
    title: "Восстановление пароля",
    subtitle: "Отправим ссылку для сброса пароля на email",
  },
};

function getAuthErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);

    if (message) {
      return message;
    }
  }

  return "Что-то пошло не так. Попробуйте еще раз.";
}

export function AuthModal({ trigger }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const copy = modeCopy[mode];

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
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля формы.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.signIn.email({
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/profile",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error));
        return;
      }

      toast.success("Вы вошли в аккаунт.");
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
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля формы.");
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
        toast.error(getAuthErrorMessage(result.error));
        return;
      }

      toast.success("Аккаунт создан.", "Проверьте email, чтобы подтвердить регистрацию.");
    });
  }

  function handleForgotPassword(formData: FormData) {
    const parsed = forgotPasswordSchema.safeParse({
      email: formData.get("email"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Введите email.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.requestPasswordReset({
        email: parsed.data.email,
        redirectTo: "/reset-password",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error));
        return;
      }

      toast.success("Проверьте почту.", "Если такой email есть в системе, мы отправили ссылку.");
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

  function handleSocialLogin(provider: "google" | "facebook") {
    startTransition(async () => {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: "/profile",
        newUserCallbackURL: "/onboarding",
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error));
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
    >
      <div className={styles.shell}>
        <div className={styles.visual} aria-hidden>
          <Image
            src="/assets/auth/auth-visual.png"
            alt=""
            fill
            priority
            sizes="(max-width: 760px) 0px, 448px"
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
                label="Имя"
                name="name"
                placeholder="Введите ваше имя"
                size="lg"
              />
            ) : null}

            <Input
              autoComplete="email"
              label="Email"
              name="email"
              placeholder="Введите ваш email"
              size="lg"
              type="email"
            />

            {mode !== "forgot-password" ? (
              <Input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                label="Пароль"
                labelAction={
                  mode === "login" ? (
                    <button
                      className={styles.linkButton}
                      onClick={() => switchMode("forgot-password")}
                      type="button"
                    >
                      Забыли пароль?
                    </button>
                  ) : null
                }
                name="password"
                placeholder="Введите пароль"
                rightIcon={
                  <button
                    aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
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
                ? "Войти"
                : mode === "register"
                  ? "Зарегистрироваться"
                  : "Отправить ссылку"}
            </Button>
          </form>

          {mode !== "forgot-password" ? (
            <>
              <div className={styles.divider}>или продолжить с</div>
              <div className={styles.socialGrid}>
                <button
                  className={styles.socialButton}
                  disabled={isPending}
                  onClick={() => handleSocialLogin("google")}
                  type="button"
                >
                  <GoogleLogo className={styles.socialIcon} />
                  Google
                </button>
                <button
                  className={styles.socialButton}
                  disabled={isPending}
                  onClick={() => handleSocialLogin("facebook")}
                  type="button"
                >
                  <FacebookLogo className={styles.socialIcon} />
                  Facebook
                </button>
              </div>
            </>
          ) : null}

          <p className={styles.switchText}>
            {mode === "login"
              ? "Нет аккаунта?"
              : mode === "register"
                ? "Уже есть аккаунт?"
                : "Вспомнили пароль?"}
            <button
              className={styles.linkButton}
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              type="button"
            >
              {mode === "login" ? "Зарегистрироваться" : "Войти"}
            </button>
          </p>
        </section>
      </div>
    </Modal>
  );
}
