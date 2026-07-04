"use client";

import type { ReactNode } from "react";

import { I18nProvider } from "@/shared/i18n/I18nProvider";
import type { Locale } from "@/shared/i18n/locales";
import { ToastProvider } from "@/shared/ui/Toast";

export function AppProviders({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <I18nProvider locale={locale}>
      <ToastProvider>{children}</ToastProvider>
    </I18nProvider>
  );
}
