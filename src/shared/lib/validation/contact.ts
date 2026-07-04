import { z } from "zod";

export const EMAIL_VALIDATION_MESSAGE = "Wpisz poprawny email.";
export const POLISH_PHONE_VALIDATION_MESSAGE = "Wpisz polski numer telefonu.";

export const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email(EMAIL_VALIDATION_MESSAGE),
);

export function normalizePolishPhone(value: string) {
  const trimmed = value.trim();

  if (!trimmed || /[^+\d\s().-]/.test(trimmed)) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  const nationalNumber =
    digits.length === 9
      ? digits
      : digits.length === 11 && digits.startsWith("48")
        ? digits.slice(2)
        : digits.length === 13 && digits.startsWith("0048")
          ? digits.slice(4)
          : "";

  if (!/^[1-9]\d{8}$/.test(nationalNumber)) {
    return null;
  }

  return `+48${nationalNumber}`;
}

export function isValidPolishPhone(value: string) {
  return normalizePolishPhone(value) !== null;
}

export const polishPhoneSchema = z
  .string()
  .trim()
  .refine(isValidPolishPhone, POLISH_PHONE_VALIDATION_MESSAGE)
  .transform((value) => normalizePolishPhone(value)!);

export const optionalPolishPhoneSchema = z
  .string()
  .trim()
  .refine((value) => !value || isValidPolishPhone(value), POLISH_PHONE_VALIDATION_MESSAGE)
  .transform((value) => (value ? normalizePolishPhone(value)! : ""));
