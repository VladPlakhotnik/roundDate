"use client";

import type { FormEvent } from "react";
import { useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { useToast } from "@/shared/ui/Toast";

import { resetPasswordSchema } from "../lib/auth-schemas";
import styles from "./ResetPasswordForm.module.css";

function getAuthErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = String(error.message);

    if (message) {
      return message;
    }
  }

  return "Не удалось обновить пароль. Попробуйте запросить новую ссылку.";
}

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  useEffect(() => {
    if (urlError) {
      toast.error("Ссылка устарела или недействительна.");
    }
  }, [toast, urlError]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      toast.error("Не найден токен восстановления.", "Запросите новую ссылку.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const parsed = resetPasswordSchema.safeParse({
      password: formData.get("password"),
      passwordConfirm: formData.get("passwordConfirm"),
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Проверьте поля формы.");
      return;
    }

    startTransition(async () => {
      const result = await authClient.resetPassword({
        newPassword: parsed.data.password,
        token,
      });

      if (result.error) {
        toast.error(getAuthErrorMessage(result.error));
        return;
      }

      toast.success("Пароль обновлен.", "Сейчас вернем вас на главную страницу.");
      window.setTimeout(() => router.push("/"), 1200);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="reset-password-title">
        <h1 className={styles.title} id="reset-password-title">
          Новый пароль
        </h1>
        <p className={styles.subtitle}>
          Придумайте новый пароль для аккаунта SpeedDate. Ссылка работает ограниченное время.
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            autoComplete="new-password"
            label="Новый пароль"
            name="password"
            placeholder="Минимум 8 символов"
            type="password"
          />

          <Input
            autoComplete="new-password"
            label="Повторите пароль"
            name="passwordConfirm"
            placeholder="Введите пароль еще раз"
            type="password"
          />

          <Button
            className={styles.submit}
            disabled={!token || isPending}
            isLoading={isPending}
            type="submit"
            fullWidth
          >
            Обновить пароль
          </Button>
        </form>
      </section>
    </main>
  );
}
