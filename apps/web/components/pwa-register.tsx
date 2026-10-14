"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        await Promise.all(registrations.filter((registration) =>
          [registration.active, registration.waiting, registration.installing].some((worker) =>
            worker?.scriptURL === new URL("/sw.js", window.location.origin).href,
          ),
        ).map((registration) => registration.unregister()));
        if ("caches" in window) {
          const names = await caches.keys();
          await Promise.all(names.filter((name) => name.startsWith("noata-static-")).map((name) => caches.delete(name)));
        }
      }).catch(() => {});
      return;
    }
    const register = () => void navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);
  return null;
}
