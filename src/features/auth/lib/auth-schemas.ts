import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Введите имя"),
  email: z.email("Введите корректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Введите корректный email"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Минимум 8 символов"),
    passwordConfirm: z.string().min(1, "Повторите пароль"),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Пароли не совпадают",
    path: ["passwordConfirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
