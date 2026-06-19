"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/shared/ui/Toast";

export function AppProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
