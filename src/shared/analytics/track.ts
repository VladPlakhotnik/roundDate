export type AnalyticsEventParams = Record<string, boolean | null | number | string | undefined>;

function cleanParams(params: AnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter((entry): entry is [string, boolean | null | number | string] => {
      const [, value] = entry;

      return value !== undefined;
    }),
  );
}

export function trackAnalyticsEvent(name: string, params: AnalyticsEventParams = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const eventName = name.trim();

  if (!eventName) {
    return;
  }

  const payload = cleanParams(params);

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, payload);
    return;
  }

  window.dataLayer?.push({
    event: eventName,
    ...payload,
  });
}
