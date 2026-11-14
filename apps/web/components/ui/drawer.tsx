"use client";

import { useEffect, useId, useRef, type PointerEvent, type ReactNode } from "react";
import { IconButton } from "./button";
import { useTranslation } from "@/lib/i18n/locale";

/**
 * Top-layer slide-over drawer built on native `<dialog showModal()>`,
 * with RTL/LTR logical `side` docking (`start` or `end`) and scroll containment.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "end",
  footer,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "start" | "end";
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
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

  const isOutsideDrawer = (e: PointerEvent<HTMLDialogElement>): boolean => {
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
      className={["nk-drawer", className].filter(Boolean).join(" ")}
      data-side={side}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        pointerDownOutside.current = e.target === e.currentTarget && isOutsideDrawer(e);
      }}
      onPointerUp={(e) => {
        if (pointerDownOutside.current && e.target === e.currentTarget && isOutsideDrawer(e)) {
          onClose();
        }
        pointerDownOutside.current = false;
      }}
    >
      <div className="nk-drawer-head">
        <h2 id={titleId} className="nk-drawer-title">
          {title}
        </h2>
        <IconButton
          icon="close"
          label={t("إغلاق", "Close")}
          onClick={onClose}
        />
      </div>
      <div className="nk-drawer-body">{children}</div>
      {footer && <div className="nk-drawer-foot">{footer}</div>}
    </dialog>
  );
}
