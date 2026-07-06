"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { trackAnalyticsEvent, type AnalyticsEventParams } from "./track";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type GoogleAnalyticsPageViewsProps = {
  measurementId: string;
};

export function GoogleAnalyticsPageViews({ measurementId }: GoogleAnalyticsPageViewsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    function parseParams(value: string | undefined): AnalyticsEventParams {
      if (!value) {
        return {};
      }

      try {
        const parsed = JSON.parse(value);

        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as AnalyticsEventParams)
          : {};
      } catch {
        return {};
      }
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const analyticsElement = target?.closest<HTMLElement>("[data-analytics-event]");
      const eventName = analyticsElement?.dataset.analyticsEvent;

      if (!eventName) {
        return;
      }

      trackAnalyticsEvent(eventName, parseParams(analyticsElement.dataset.analyticsParams));
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    if (!pathname || typeof window.gtag !== "function") {
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag("config", measurementId, {
      anonymize_ip: true,
      page_path: pagePath,
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}
