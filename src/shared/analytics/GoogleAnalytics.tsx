import { Suspense } from "react";
import Script from "next/script";

import { GoogleAnalyticsPageViews } from "./GoogleAnalyticsPageViews";

type GoogleAnalyticsProps = {
  measurementId: string | undefined;
};

function normalizeMeasurementId(measurementId: string | undefined) {
  const trimmed = measurementId?.trim();

  if (!trimmed || !/^G-[A-Z0-9]+$/i.test(trimmed)) {
    return null;
  }

  return trimmed.toUpperCase();
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const safeMeasurementId = normalizeMeasurementId(measurementId);

  if (!safeMeasurementId) {
    return null;
  }

  return (
    <>
      <Script
        id="google-consent-mode"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function(){ window.dataLayer.push(arguments); };
            window.gtag('consent', 'default', {
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              analytics_storage: 'denied',
              wait_for_update: 500
            });
          `,
        }}
      />
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${safeMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.gtag('js', new Date());
            window.gtag('config', '${safeMeasurementId}', {
              anonymize_ip: true,
              send_page_view: false
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <GoogleAnalyticsPageViews measurementId={safeMeasurementId} />
      </Suspense>
    </>
  );
}
