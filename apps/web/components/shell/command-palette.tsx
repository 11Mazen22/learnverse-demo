"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { applyLocale, localized, useLocale } from "@/lib/i18n/locale";
import { matchesStaffSearch } from "@/lib/dashboard/staff-search";
import { getActiveModeConstraint, isThemeModeAllowed, resolveAppearance } from "@/lib/appearance/mode";
import { THEME_PREF_PREFIX, writeScopedDevicePreference } from "@/lib/appearance/device-preferences";
import { syncBrowserThemeColor } from "@/components/preferences/palette-gallery";
import {
  buildCommandActions,
  type CommandAction,
  type EffectiveRole,
} from "@/lib/shell/navigation";

const CATEGORY_LABELS: Record<
  CommandAction["category"],
  { ar: string; en: string }
> = {
  recent: { ar: "زياراتك الأخيرة", en: "Recent" },
  quick: { ar: "إجراءات سريعة", en: "Quick actions" },
  navigation: { ar: "أقسام المنصة", en: "Navigation" },
  subjects: { ar: "المواد الدراسية", en: "Subjects" },
  preferences: { ar: "المظهر واللغة", en: "Appearance & Language" },
};

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  effectiveRole,
  recentHrefs,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (href: string) => void;
  effectiveRole: EffectiveRole;
  recentHrefs: readonly string[];
}) {
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);
  const { push } = useToast();

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">("light");
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const optionRefs = useRef<Array<HTMLElement | null>>([]);
  const wasOpen = useRef(false);

  // Track active theme & focus restoration when CommandPalette opens/closes
  useEffect(() => {
    if (open && !wasOpen.current) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      const docTheme = document.documentElement.dataset.theme;
      setCurrentTheme(docTheme === "dark" ? "dark" : "light");
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && wasOpen.current) {
      setQuery("");
      setActiveIndex(0);
      const prev = previousFocusRef.current;
      previousFocusRef.current = null;
      if (prev && prev.isConnected) {
        requestAnimationFrame(() => prev.focus());
      }
    }
    wasOpen.current = open;
  }, [open]);

  const allActions = useMemo(
    () =>
      buildCommandActions({
        effectiveRole,
        recentHrefs,
        currentTheme,
        locale,
      }),
    [effectiveRole, recentHrefs, currentTheme, locale]
  );

  const filteredActions = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // Curate empty-query view: recent + quick + preferences + top navigation
      return allActions.filter(
        (a) => a.category !== "subjects"
      );
    }
    return allActions.filter((action) =>
      matchesStaffSearch(
        trimmed,
        [action.labelAr, action.labelEn, action.descriptionAr, action.descriptionEn, ...action.keywords],
        locale
      )
    );
  }, [allActions, query, locale]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open, filteredActions.length]);

  function executeAction(action: CommandAction) {
    if (action.effect === "toggle-sidebar") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("noata:toggle-sidebar"));
      }
      onClose();
      return;
    }

    if (action.effect === "toggle-locale") {
      const nextLocale = locale === "ar" ? "en" : "ar";
      applyLocale(nextLocale);
      push({
        title:
          nextLocale === "en" ? "Interface switched to English" : "تم تحويل الواجهة إلى العربية",
        tone: "success",
      });
      onClose();
      return;
    }

    if (action.effect === "toggle-theme") {
      const palette = document.documentElement.dataset.palette || "classic";
      const constraint = getActiveModeConstraint();
      const targetTheme = currentTheme === "dark" ? "light" : "dark";
      if (!isThemeModeAllowed(targetTheme, palette, constraint)) {
        push({
          title: t(
            "هذه اللوحة مصممة للوضع الداكن فقط. افتح الإعدادات لتغيير اللوحة.",
            "This palette is locked to dark mode. Open Settings to switch palettes."
          ),
          tone: "info",
        });
        onClose();
        return;
      }
      const next = resolveAppearance(targetTheme, palette, targetTheme === "dark", constraint);
      document.documentElement.dataset.theme = next;
      writeScopedDevicePreference(THEME_PREF_PREFIX, next);
      syncBrowserThemeColor();
      setCurrentTheme(next);
      push({
        title:
          next === "dark"
            ? t("تم تفعيل الوضع الليلي", "Dark mode enabled")
            : t("تم تفعيل الوضع النهاري", "Light mode enabled"),
        tone: "success",
      });
      onClose();
      return;
    }

    if (action.href) {
      onClose();
      onNavigate(action.href);
    }
  }

  // Group contiguous categories cleanly for display without breaking index order
  let lastCategory: string | null = null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("مركز الأوامر والانتقال السريع", "Command Center & Quick Jump")}
    >
      <div className="nk-cmd-shell">
        <div className="nk-cmd-input-wrap">
          <Icon name="search" size={18} />
          <input
            ref={inputRef}
            className="search command-input nk-cmd-input"
            role="combobox"
            aria-expanded={filteredActions.length > 0}
            aria-autocomplete="list"
            aria-controls={filteredActions.length > 0 ? "noata-command-results" : undefined}
            aria-activedescendant={
              filteredActions[activeIndex]
                ? `noata-command-option-${activeIndex}`
                : undefined
            }
            aria-label={t("ابحث عن صفحة أو مادة أو إجراء", "Search pages, subjects, or quick actions")}
            placeholder={t(
              "اكتب اسم صفحة، مادة، بطاقات، أو «مظهر»…",
              "Type a page, subject, flashcards, theme, or language…"
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                if (!filteredActions.length) return;
                const dir = event.key === "ArrowDown" ? 1 : -1;
                setActiveIndex(
                  (curr) => (curr + dir + filteredActions.length) % filteredActions.length
                );
              } else if (event.key === "Home") {
                event.preventDefault();
                setActiveIndex(0);
              } else if (event.key === "End") {
                event.preventDefault();
                setActiveIndex(Math.max(0, filteredActions.length - 1));
              } else if (event.key === "Enter") {
                const chosen = filteredActions[activeIndex];
                if (!chosen) return;
                event.preventDefault();
                executeAction(chosen);
              }
            }}
          />
          <kbd className="nk-cmd-esc">ESC</kbd>
        </div>

        <div
          className="nk-cmd-scroll"
          tabIndex={0}
          aria-label={t("قائمة نتائج الأوامر", "Command results list")}
        >
          {filteredActions.length ? (
            <div
              id="noata-command-results"
              className="command-results nk-cmd-list"
              role="listbox"
              aria-label={t("نتائج مركز الأوامر", "Command results")}
            >
              {filteredActions.map((action, index) => {
                const showHeading = action.category !== lastCategory;
                lastCategory = action.category;
                const selected = index === activeIndex;
                const catMeta = CATEGORY_LABELS[action.category];

                const content = (
                  <>
                    <span className="nk-cmd-item-icon" aria-hidden="true">
                      <Icon name={action.icon} size={18} />
                    </span>
                    <span className="nk-cmd-item-text">
                      <b>{t(action.labelAr, action.labelEn)}</b>
                      <small>{t(action.descriptionAr, action.descriptionEn)}</small>
                    </span>
                    <span className="nk-cmd-item-end" aria-hidden="true">
                      <Icon name={action.effect ? "sparkles" : "arrow"} size={15} />
                    </span>
                  </>
                );

                return (
                  <div key={action.id} role="presentation" className="nk-cmd-group-wrap">
                    {showHeading && (
                      <div className="nk-cmd-category" aria-hidden="true">
                        {t(catMeta.ar, catMeta.en)}
                      </div>
                    )}
                    {action.href ? (
                      <Link
                        href={action.href}
                        id={`noata-command-option-${index}`}
                        role="option"
                        aria-selected={selected}
                        tabIndex={-1}
                        className={`nk-cmd-item${selected ? " is-selected" : ""}`}
                        ref={(node) => {
                          optionRefs.current[index] = node;
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={(e) => {
                          e.preventDefault();
                          executeAction(action);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        id={`noata-command-option-${index}`}
                        role="option"
                        aria-selected={selected}
                        tabIndex={-1}
                        className={`nk-cmd-item${selected ? " is-selected" : ""}`}
                        ref={(node) => {
                          optionRefs.current[index] = node;
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => executeAction(action)}
                      >
                        {content}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="command-results command-empty nk-cmd-empty" role="status">
              {t(
                "لا توجد نتيجة مطابقة. جرّب البحث باسم المادة أو «مذاكرة» أو «مظهر».",
                "No matching command found. Try a subject name, \"flashcards\", or \"theme\"."
              )}
            </p>
          )}
        </div>

        <div className="nk-cmd-footer" aria-hidden="true">
          <span>↑↓ {t("للتنقل", "Navigate")}</span>
          <span>↵ {t("للتنفيذ", "Open / Run")}</span>
          <span>ESC {t("للإغلاق", "Close")}</span>
        </div>
      </div>
    </Dialog>
  );
}
