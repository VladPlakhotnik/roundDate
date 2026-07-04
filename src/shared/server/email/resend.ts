import "server-only";

import { Resend } from "resend";

import { contactEmail } from "@/shared/config/contact";

let resend: Resend | undefined;

export function getResend() {
  if (resend) {
    return resend;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to initialize Resend.");
  }

  resend = new Resend(apiKey);

  return resend;
}

export function getDefaultFromEmail() {
  return process.env.EMAIL_FROM ?? `RoundDate <${contactEmail}>`;
}
