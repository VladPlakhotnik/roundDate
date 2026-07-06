"use client";

import { useEffect, useState } from "react";

import { useI18n } from "@/shared/i18n/I18nProvider";
import { Button } from "@/shared/ui/Button";

import styles from "./AnalyticsConsentBanner.module.css";

type AnalyticsConsentBannerProps = {
  measurementId: string;
};

const analyticsConsentStorageKey = "rounddate-analytics-consent";

type AnalyticsConsentValue = "denied" | "granted";

function updateAnalyticsConsent(value: AnalyticsConsentValue) {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "update", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: value,
  });
}

function trackCurrentPage(measurementId: string) {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("config", measurementId, {
    anonymize_ip: true,
    page_path: `${window.location.pathname}${window.location.search}`,
  });
}

export function AnalyticsConsentBanner({ measurementId }: AnalyticsConsentBannerProps) {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameId: number | null = null;

    try {
      const savedConsent = window.localStorage.getItem(analyticsConsentStorageKey);

      if (savedConsent === "granted" || savedConsent === "denied") {
        updateAnalyticsConsent(savedConsent);
        return undefined;
      }
    } catch {
      // Continue and show the banner; the runtime consent update can still work for this visit.
    }

    frameId = window.requestAnimationFrame(() => setIsVisible(true));

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  function saveConsent(value: AnalyticsConsentValue) {
    try {
      window.localStorage.setItem(analyticsConsentStorageKey, value);
    } catch {
      // If storage is unavailable, keep the runtime consent update for this page view.
    }

    updateAnalyticsConsent(value);

    if (value === "granted") {
      trackCurrentPage(measurementId);
    }

    setIsVisible(false);
  }

  if (!isVisible) {
    return null;
  }

  return (
    <aside className={styles.root} aria-label={t("common.analyticsConsent.label")}>
      <div className={styles.content}>
        <div className={styles.copy}>
          <p className={styles.title}>{t("common.analyticsConsent.title")}</p>
          <p className={styles.description}>{t("common.analyticsConsent.description")}</p>
        </div>
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => saveConsent("denied")}>
            {t("common.analyticsConsent.decline")}
          </Button>
          <Button size="sm" onClick={() => saveConsent("granted")}>
            {t("common.analyticsConsent.accept")}
          </Button>
        </div>
      </div>
    </aside>
  );
}
