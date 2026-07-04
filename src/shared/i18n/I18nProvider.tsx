"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { defaultLocale, localeCookieName, resolveLocale, type Locale } from "./locales";
import { translate } from "./translate";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: Record<string, number | string>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);
const fallbackI18nContext: I18nContextValue = {
  locale: defaultLocale,
  setLocale: () => undefined,
  t: (key, values) => translate(defaultLocale, key, values),
};

function persistLocale(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function I18nProvider({ children, locale }: { children: ReactNode; locale: Locale }) {
  const [currentLocale, setCurrentLocale] = useState(resolveLocale(locale));

  useEffect(() => {
    let isActive = true;
    const nextLocale = resolveLocale(locale);

    queueMicrotask(() => {
      if (isActive) {
        setCurrentLocale(nextLocale);
      }
    });

    return () => {
      isActive = false;
    };
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setCurrentLocale(nextLocale);
    persistLocale(nextLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: currentLocale,
      setLocale,
      t: (key, values) => translate(currentLocale, key, values),
    }),
    [currentLocale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  return context ?? fallbackI18nContext;
}
