"use client";

import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from "react";
import { Icon } from "./icon";
import { useTranslation } from "@/lib/i18n/locale";

/**
 * Accessible native modal dialog wrapper using top-layer `showModal()`,
 * `aria-labelledby`, and pointer-coordinate backdrop click dismissal.
 */
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
  variant?: "default" | "workshop" | "studio" | "ai";
}) {
  const t = useTranslation();
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const pointerDownOutside = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const isOutsideDialog = (e: PointerEvent<HTMLDialogElement>): boolean => {
    const el = ref.current;
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    );
  };

  return (
    <dialog
      ref={ref}
      className={`noata-dialog${variant !== "default" ? " noata-dialog--" + variant : ""}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        pointerDownOutside.current = e.target === e.currentTarget && isOutsideDialog(e);
      }}
      onPointerUp={(e) => {
        if (pointerDownOutside.current && e.target === e.currentTarget && isOutsideDialog(e)) {
          onClose();
        }
        pointerDownOutside.current = false;
      }}
    >
      <div className="dialog-heading">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="icon-btn"
          onClick={onClose}
          aria-label={t("إغلاق", "Close")}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
