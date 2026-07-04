import { defaultLocale, type Locale } from "./locales";
import { messages } from "./messages";

type Primitive = number | string;
type TranslationValues = Record<string, Primitive>;

function getPathValue(source: unknown, key: string): unknown {
  return key.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    return (current as Record<string, unknown>)[part];
  }, source);
}

function interpolate(template: string, values?: TranslationValues) {
  if (!values) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
  );
}

export function translate(locale: Locale, key: string, values?: TranslationValues) {
  const localizedValue = getPathValue(messages[locale], key);
  const fallbackValue = getPathValue(messages[defaultLocale], key);
  const value = typeof localizedValue === "string" ? localizedValue : fallbackValue;

  if (typeof value !== "string") {
    if (process.env.NODE_ENV !== "production") {
      return `[missing:${key}]`;
    }

    return key;
  }

  return interpolate(value, values);
}

export function createTranslator(locale: Locale) {
  return (key: string, values?: TranslationValues) => translate(locale, key, values);
}

export type Translator = ReturnType<typeof createTranslator>;
