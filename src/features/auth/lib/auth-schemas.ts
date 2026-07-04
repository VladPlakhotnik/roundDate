import { z } from "zod";

import { emailSchema } from "@/shared/lib/validation/contact";

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Wpisz hasło."),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Wpisz imię."),
  email: emailSchema,
  password: z.string().min(8, "Minimum 8 znaków."),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Minimum 8 znaków."),
    passwordConfirm: z.string().min(1, "Powtórz hasło."),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są takie same.",
    path: ["passwordConfirm"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
