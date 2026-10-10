"use client";

import { useSyncExternalStore } from "react";

export type Locale = "ar" | "en";
const EVENT = "noata-locale-change";

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
  return useSyncExternalStore(subscribe, readLocale, () => "ar");
}

export function localized(locale: Locale, ar: string, en: string) {
  return locale === "en" ? en : ar;
}
