"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";

type SidebarGroupProps = {
  id: string;
  titleAr: string;
  titleEn: string;
  icon?: string;
  badge?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  controlledOpen?: boolean;
  onOpenChange?: (id: string, open: boolean) => void;
  hasActiveChild?: boolean;
  isCollapsedSidebar: boolean;
  children: React.ReactNode;
};

export function SidebarGroup({
  id,
  titleAr,
  titleEn,
  icon,
  badge,
  collapsible = false,
  defaultExpanded = true,
  controlledOpen,
  onOpenChange,
  hasActiveChild = false,
  isCollapsedSidebar,
  children,
}: SidebarGroupProps) {
  const locale = useLocale();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultExpanded || hasActiveChild);
  const prevActiveChild = useRef(hasActiveChild);
  const isControlled = typeof controlledOpen === "boolean";
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  // When a route transitions into this group, expand it if currently closed
  useEffect(() => {
    if (hasActiveChild && !prevActiveChild.current) {
      if (isControlled) {
        if (!controlledOpen) onOpenChange?.(id, true);
      } else {
        setUncontrolledOpen(true);
      }
    }
    prevActiveChild.current = hasActiveChild;
  }, [hasActiveChild, isControlled, controlledOpen, id, onOpenChange]);

  const handleToggle = () => {
    const next = !isOpen;
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(id, next);
  };

  const title = localized(locale, titleAr, titleEn);

  if (isCollapsedSidebar) {
    return (
      <div className="noata-sidebar-group is-collapsed-sidebar" data-group-id={id}>
        <div className="noata-group-divider" aria-hidden="true" />
        <div className="noata-group-items-rail">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`noata-sidebar-group ${collapsible ? "is-collapsible" : ""} ${
        isOpen ? "is-expanded" : "is-closed"
      }`}
      data-group-id={id}
    >
      <div className="noata-group-header">
        {collapsible ? (
          <button
            type="button"
            className="noata-group-trigger"
            aria-expanded={isOpen}
            aria-controls={`group-content-${id}`}
            onClick={handleToggle}
          >
            <span className="noata-group-title-wrap">
              {icon && (
                <span className="noata-group-icon" aria-hidden="true">
                  <Icon name={icon} size={14} />
                </span>
              )}
              <span className="noata-group-title">{title}</span>
              {badge && <span className="noata-group-count">{badge}</span>}
            </span>
            <span
              className={`noata-group-chevron ${isOpen ? "is-rotated" : ""}`}
              aria-hidden="true"
            >
              <Icon name="chevron" size={14} />
            </span>
          </button>
        ) : (
          <div className="noata-group-static-title">
            {icon && (
              <span className="noata-group-icon" aria-hidden="true">
                <Icon name={icon} size={14} />
              </span>
            )}
            <span className="noata-group-title">{title}</span>
            {badge && <span className="noata-group-count">{badge}</span>}
          </div>
        )}
      </div>

      <div
        id={`group-content-${id}`}
        className="noata-group-content-animator"
        aria-hidden={collapsible ? !isOpen : undefined}
      >
        <div className="noata-group-content-inner">
          <div className="noata-group-items">{children}</div>
        </div>
      </div>
    </div>
  );
}
