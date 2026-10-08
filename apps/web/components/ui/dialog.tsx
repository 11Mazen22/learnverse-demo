"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icon";
export function Dialog({
  open,
  onClose,
  title,
  children,
  variant = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  variant?: "default" | "workshop";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (open && !el?.open) el?.showModal();
    if (!open && el?.open) el.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      const dialogs =
        document.querySelectorAll<HTMLDialogElement>("dialog[open]");
      if (event.key !== "Escape" || dialogs[dialogs.length - 1] !== ref.current)
        return;
      // Stop the native close request before it fires: Chrome can dispatch a
      // non-cancelable `cancel` event when the opener lacks user activation.
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener("keydown", escape, true);
    return () => window.removeEventListener("keydown", escape, true);
  }, [open, onClose]);
  return (
    <dialog
      ref={ref}
      className={`noata-dialog${variant === "workshop" ? " noata-dialog--workshop" : ""}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <div className="dialog-heading">
        <h2>{title}</h2>
        <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
