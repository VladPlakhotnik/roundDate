import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const passwordRequirementIds = ["length", "letter", "number", "noSpaces"] as const;

export type PasswordRequirementId = (typeof passwordRequirementIds)[number];

export function getPasswordRequirements(password: string): Record<PasswordRequirementId, boolean> {
  return {
    length: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    letter: /\p{L}/u.test(password),
    number: /\d/.test(password),
    noSpaces: !/\s/.test(password),
  };
}

export function isPasswordValid(password: string) {
  return Object.values(getPasswordRequirements(password)).every(Boolean);
}

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Minimum ${PASSWORD_MIN_LENGTH} znaków.`)
  .max(PASSWORD_MAX_LENGTH, `Maksimum ${PASSWORD_MAX_LENGTH} znaków.`)
  .regex(/\p{L}/u, "Dodaj co najmniej jedną literę.")
  .regex(/\d/, "Dodaj co najmniej jedną cyfrę.")
  .refine((password) => !/\s/.test(password), "Hasło nie może zawierać spacji.");
