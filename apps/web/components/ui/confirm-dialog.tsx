"use client";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Icon } from "./icon";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  icon?: string;
};

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

let pending: PendingConfirm | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

/** Opens the Noata-styled confirmation modal and resolves with the user's choice. */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  pending?.resolve(false);
  return new Promise((resolve) => {
    pending = { ...options, resolve };
    emit();
  });
}

function settle(value: boolean) {
  const current = pending;
  pending = null;
  emit();
  current?.resolve(value);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ConfirmHost() {
  const current = useSyncExternalStore(
    subscribe,
    () => pending,
    () => null,
  );
  const ref = useRef<HTMLDialogElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (current && !el.open) {
      el.showModal();
      (current.tone === "danger" ? cancelRef : confirmRef).current?.focus();
    }
    if (!current && el.open) el.close();
  }, [current]);

  const danger = current?.tone === "danger";
  return (
    <dialog
      ref={ref}
      className="noata-confirm"
      data-tone={danger ? "danger" : "default"}
      aria-labelledby="noata-confirm-title"
      aria-describedby={
        current?.description ? "noata-confirm-description" : undefined
      }
      onCancel={(event) => {
        event.preventDefault();
        settle(false);
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) settle(false);
      }}
    >
      {current && (
        <div className="noata-confirm-body">
          <span className="noata-confirm-icon" aria-hidden="true">
            <Icon name={current.icon ?? (danger ? "close" : "help")} size={22} />
          </span>
          <h2 id="noata-confirm-title">{current.title}</h2>
          {current.description && (
            <p id="noata-confirm-description">{current.description}</p>
          )}
          <div className="noata-confirm-actions">
            <button
              ref={confirmRef}
              type="button"
              className="noata-confirm-primary"
              onClick={() => settle(true)}
            >
              {current.confirmLabel ?? "تأكيد"}
            </button>
            <button
              ref={cancelRef}
              type="button"
              className="noata-confirm-secondary"
              onClick={() => settle(false)}
            >
              {current.cancelLabel ?? "إلغاء"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
