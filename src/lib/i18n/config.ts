export type Locale = "en" | "ar";

export const locales: Locale[] = ["en", "ar"];

export const defaultLocale: Locale = "en";

export const rtlLocales: Locale[] = ["ar"];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}

export function getDirection(locale: Locale): "ltr" | "rtl" {
  return isRTL(locale) ? "rtl" : "ltr";
}
