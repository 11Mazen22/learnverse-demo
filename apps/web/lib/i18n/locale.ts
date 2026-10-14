"use client";

import { createContext, createElement, useContext, useCallback, useSyncExternalStore, type ReactNode } from "react";

export type Locale = "ar" | "en";
const EVENT = "noata-locale-change";
const InitialLocale = createContext<Locale>("ar");
export function LocaleProvider({initialLocale,children}:{initialLocale:Locale;children:ReactNode}){
 return createElement(InitialLocale.Provider,{value:initialLocale},children);
}

export function readLocale(): Locale {
  if (typeof document === "undefined") return "ar";
  return document.documentElement.lang === "en" ? "en" : "ar";
}

export function applyLocale(locale: Locale, persist = true) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  if (persist) {
    try { localStorage.setItem("noata-locale", locale); }
    catch { /* The account preference remains authoritative. */ }
  }
  // A non-sensitive preference lets the next server render start in the chosen language.
  try { document.cookie = "noata_locale=" + locale + "; Path=/; Max-Age=31536000; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : ""); } catch { /* The current language still works when cookies are disabled. */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === "noata-locale" && (event.newValue === "ar" || event.newValue === "en")) {
      applyLocale(event.newValue, false);
    }
    onChange();
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLocale(): Locale {
  const initialLocale = useContext(InitialLocale);
  return useSyncExternalStore(subscribe, readLocale, () => initialLocale);
}

export function localized(locale: Locale, ar: string, en: string) {
  return locale === "en" ? en : ar;
}

/** Stable copy selector for components and their asynchronous callbacks. */
export function useTranslation() {
  const locale = useLocale();
  return useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
}
