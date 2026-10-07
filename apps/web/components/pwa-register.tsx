"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = () =>
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      if (document.readyState === "complete") void register();
      else window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
