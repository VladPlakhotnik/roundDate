"use client";

import { useEffect, useRef } from "react";

import { useToast, type ToastType } from "@/shared/ui/Toast";

export type ProfilePaymentToastNotice = {
  description?: string;
  title: string;
  type: Extract<ToastType, "error" | "success" | "warning">;
};

type ProfilePaymentToastProps = {
  notice: ProfilePaymentToastNotice | null;
};

function clearPaymentSearchParams() {
  const url = new URL(window.location.href);

  url.searchParams.delete("booking_id");
  url.searchParams.delete("payment");
  url.searchParams.delete("session_id");

  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

export function ProfilePaymentToast({ notice }: ProfilePaymentToastProps) {
  const toast = useToast();
  const shownRef = useRef(false);

  useEffect(() => {
    if (!notice || shownRef.current) {
      return;
    }

    shownRef.current = true;
    toast[notice.type](notice.title, notice.description);
    clearPaymentSearchParams();
  }, [notice, toast]);

  return null;
}
