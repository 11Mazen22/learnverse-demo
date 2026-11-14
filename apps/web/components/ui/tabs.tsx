"use client";

import { useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./icon";

export type TabItem = {
  id: string;
  label: string;
  icon?: IconName;
  badge?: string | number;
  content: ReactNode;
  disabled?: boolean;
};

/**
 * Accessible horizontal tabs following WAI-ARIA Tabs pattern and RTL/LTR arrow keys.
 * Uses border underline indicators so active state stays crisp in Forced Colors Mode.
 */
export function Tabs({
  items,
  activeId,
  onChange,
  label,
  className = "",
}: {
  items: readonly TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const enabled = items.filter((item) => !item.disabled);
  const active = items.find((item) => item.id === activeId) ?? items[0];

  const moveFocus = (nextId: string) => {
    onChange(nextId);
    const btn = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-id="${CSS.escape(nextId)}"]`,
    );
    btn?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentId: string) => {
    if (enabled.length < 2) return;
    const isRtl =
      typeof document !== "undefined" &&
      document.documentElement.dir === "rtl";
    const forwardKey = isRtl ? "ArrowLeft" : "ArrowRight";
    const backwardKey = isRtl ? "ArrowRight" : "ArrowLeft";
    const idx = enabled.findIndex((item) => item.id === currentId);
    if (idx === -1) return;

    if (event.key === forwardKey) {
      event.preventDefault();
      moveFocus(enabled[(idx + 1) % enabled.length].id);
    } else if (event.key === backwardKey) {
      event.preventDefault();
      moveFocus(enabled[(idx - 1 + enabled.length) % enabled.length].id);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveFocus(enabled[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      moveFocus(enabled[enabled.length - 1].id);
    }
  };

  if (!active) return null;

  return (
    <div className={["nk-tabs", className].filter(Boolean).join(" ")}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className="nk-tablist"
      >
        {items.map((item) => {
          const selected = item.id === active.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              data-tab-id={item.id}
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className="nk-tab"
              onClick={() => onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
            >
              {item.icon && <Icon name={item.icon} size={16} />}
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span className="nk-badge nk-badge--neutral">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel-${active.id}`}
        aria-labelledby={`${baseId}-tab-${active.id}`}
        tabIndex={0}
        className="nk-tabpanel"
      >
        {active.content}
      </div>
    </div>
  );
}
