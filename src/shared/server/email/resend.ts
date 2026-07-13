import "server-only";

import { Resend } from "resend";

import { contactEmail } from "@/shared/config/contact";

let resend: Resend | undefined;

function readEnvValue(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    return undefined;
  }

  const quote = value[0];
  if ((quote === `"` || quote === "'") && value[value.length - 1] === quote) {
    return value.slice(1, -1).trim() || undefined;
  }

  return value;
}

export function getResend() {
  if (resend) {
    return resend;
  }

  const apiKey = readEnvValue("RESEND_API_KEY");

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to initialize Resend.");
  }

  resend = new Resend(apiKey);

  return resend;
}

export function getDefaultFromEmail() {
  return readEnvValue("EMAIL_FROM") ?? `RoundDate <${contactEmail}>`;
}
