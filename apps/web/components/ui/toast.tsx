"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Icon } from "./icon";
import { IconButton } from "./button";
import { useTranslation } from "@/lib/i18n/locale";

export type ToastTone = "info" | "success" | "warning" | "danger";

export type ToastItem = {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
};

const MAX_TOASTS = 4;
let toasts: ToastItem[] = [];
const listeners = new Set<() => void>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Dismiss a single active toast notification by id. */
export function dismissToast(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  const next = toasts.filter((item) => item.id !== id);
  if (next.length !== toasts.length) {
    toasts = next;
    emit();
  }
}

/** Remove all active toasts immediately. */
export function clearToasts() {
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
  if (toasts.length > 0) {
    toasts = [];
    emit();
  }
}

/** Push a standardized non-blocking toast notification into the global live region. */
export function pushToast(options: Omit<ToastItem, "id"> & { id?: string }): string {
  const id =
    options.id ??
    `nk-toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const item: ToastItem = {
    tone: "info",
    durationMs: 4800,
    ...options,
    id,
  };

  toasts = [...toasts.filter((t) => t.id !== id), item].slice(-MAX_TOASTS);
  emit();

  if (typeof window !== "undefined" && item.durationMs && item.durationMs > 0) {
    const existing = timers.get(id);
    if (existing) clearTimeout(existing);
    timers.set(
      id,
      setTimeout(() => dismissToast(id), item.durationMs),
    );
  }

  return id;
}

/** Hook returning toast helpers bound to Noäta's standardized notification queue. */
export function useToast() {
  return {
    push: pushToast,
    dismiss: dismissToast,
    clear: clearToasts,
  };
}

const toneIcon = (tone: ToastTone): "info" | "check-circle" | "alert-triangle" | "alert-circle" => {
  if (tone === "success") return "check-circle";
  if (tone === "warning") return "alert-triangle";
  if (tone === "danger") return "alert-circle";
  return "info";
};

/**
 * Mounts the single accessible polite live region (`role="status" aria-live="polite"`)
 * for transient non-blocking feedback across the application.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const t = useTranslation();
  const active = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => [],
  );

  useEffect(() => {
    return () => clearToasts();
  }, []);

  return (
    <>
      {children}
      <div
        className="nk-toast-region"
        role="region"
        aria-label={t("الإشعارات", "Notifications")}
        aria-live="polite"
        aria-atomic="false"
      >
        {active.map((item) => {
          const tone = item.tone ?? "info";
          return (
            <div
              key={item.id}
              className={`nk-toast nk-toast--${tone}`}
              role={tone === "danger" ? "alert" : "status"}
            >
              <Icon name={toneIcon(tone)} size={18} />
              <div className="nk-toast-copy">
                <strong className="nk-toast-title">{item.title}</strong>
                {item.description && (
                  <span className="nk-toast-desc">{item.description}</span>
                )}
              </div>
              <IconButton
                icon="close"
                size="sm"
                label={t("إغلاق الإشعار", "Dismiss notification")}
                onClick={() => dismissToast(item.id)}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}
