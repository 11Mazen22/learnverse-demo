"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import {
  resolveAppearance,
  isThemeModeAllowed,
  getActiveModeConstraint,
  type PaletteModeConstraint,
  type AppearanceMode,
} from "@/lib/appearance/mode";
import { Icon } from "@/components/ui/icon";
import { PaletteGallery, syncBrowserThemeColor } from "@/components/preferences/palette-gallery";
import { localized, useLocale } from "@/lib/i18n/locale";

type Theme = "light" | "dark" | "system";
const choices: {
  value: Theme;
  label: string;
  labelEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
}[] = [
  {
    value: "light",
    label: "نهاري",
    labelEn: "Light",
    description: "إضاءة مريحة وواضحة للمذاكرة النهارية",
    descriptionEn: "Clear, comfortable daylight illumination",
    icon: "sun",
  },
  {
    value: "dark",
    label: "ليلي",
    labelEn: "Dark",
    description: "ألوان هادئة تحمي العين وتقلل التشتت",
    descriptionEn: "Calm nocturnal tones reducing eye strain",
    icon: "moon",
  },
  {
    value: "system",
    label: "تلقائي",
    labelEn: "System",
    description: "يتكيف تلقائيًا مع مظهر جهازك",
    descriptionEn: "Follows your operating system appearance",
    icon: "screen",
  },
];

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function apply(theme: Theme) {
  const pal = typeof document !== "undefined" ? document.documentElement.dataset.palette : "classic";
  const constraint = getActiveModeConstraint();
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolveAppearance(
      theme,
      pal,
      window.matchMedia("(prefers-color-scheme: dark)").matches,
      constraint
    );
    syncBrowserThemeColor();
  }
}

export function ThemeControl() {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const choiceSequence = useRef(0);
  const themeWrite = useRef<Promise<unknown>>(Promise.resolve());
  const [theme, setTheme] = useState<Theme>("system");
  const [activePalette, setActivePalette] = useState<string>("classic");
  const [activeConstraint, setActiveConstraint] = useState<PaletteModeConstraint>("both");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("noata-theme");
    } catch {
      setNotice(t("تعذّر حفظ المظهر على هذا الجهاز.", "Could not save appearance on this device."));
    }
    const initial: Theme = isTheme(stored) ? stored : "system";
    setTheme(initial);
    apply(initial);

    const syncConstraints = () => {
      if (typeof document === "undefined") return;
      const curPalette = document.documentElement.dataset.palette || "classic";
      const curConstraint = getActiveModeConstraint();
      setActivePalette(curPalette);
      setActiveConstraint(curConstraint);

      setTheme((prev) => {
        if (!isThemeModeAllowed(prev, curPalette, curConstraint)) {
          const fallback: Theme = curConstraint === "light-only" ? "light" : "dark";
          apply(fallback);
          try {
            localStorage.setItem("noata-theme", fallback);
          } catch {}
          return fallback;
        }
        return prev;
      });
    };

    syncConstraints();
    window.addEventListener("noata-palette-change", syncConstraints);
    window.addEventListener("noata-custom-theme-change", syncConstraints);
    window.addEventListener("storage", syncConstraints);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const osChanged = () => {
      let current: string | null = null;
      try {
        current = localStorage.getItem("noata-theme");
      } catch {}
      if (!isTheme(current) || current === "system") apply("system");
    };
    media.addEventListener("change", osChanged);

    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);

    void (async () => {
      try {
        const user = account.user;
        if (!user || !active) return;
        const { data } = await supabase
          .from("user_settings")
          .select("theme")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!active || !isTheme(data?.theme)) return;
        setTheme(data.theme);
        try {
          localStorage.setItem("noata-theme", data.theme);
        } catch {}
        apply(data.theme);
      } catch {
        // Device preference stays functional offline.
      }
    })();

    return () => {
      active = false;
      window.removeEventListener("noata-palette-change", syncConstraints);
      window.removeEventListener("noata-custom-theme-change", syncConstraints);
      window.removeEventListener("storage", syncConstraints);
      media.removeEventListener("change", osChanged);
      document.removeEventListener("pointerdown", outside);
    };
  }, [supabase, account.user, t]);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"], [aria-checked="true"]')?.focus();

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const buttons = Array.from(
          menu.current?.querySelectorAll<HTMLButtonElement>(
            ".aura-mode-option:not([disabled]), .noata-palette-grid button",
          ) ?? [],
        );
        if (!buttons.includes(document.activeElement as HTMLButtonElement)) return;
        event.preventDefault();
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[
          (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length
        ]?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  async function choose(next: Theme) {
    if (!isThemeModeAllowed(next, activePalette, activeConstraint)) return;
    const seq = ++choiceSequence.current,
      token = account.revision.current;
    setTheme(next);
    setOpen(false);
    trigger.current?.focus();
    setNotice("");
    try {
      localStorage.setItem("noata-theme", next);
    } catch {
      setNotice(
        t(
          "المظهر مفعّل لهذه الجلسة فقط؛ تعذّر حفظه على الجهاز.",
          "Appearance is active for this session only; it could not be saved on this device."
        )
      );
    }
    apply(next);
    try {
      const user = account.user;
      if (!user) return;
      const activeLoc =
        typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "ar";
      const save = themeWrite.current
        .catch(() => {})
        .then(async () => {
          if (seq !== choiceSequence.current || token !== account.revision.current)
            return { error: null };
          return supabase
            .from("user_settings")
            .upsert(
              {
                user_id: user.id,
                theme: next,
                locale: activeLoc,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            )
            .select("user_id")
            .single();
        });
      themeWrite.current = save;
      const { error } = await save;
      if (seq !== choiceSequence.current || token !== account.revision.current) return;
      if (error)
        setNotice(t("تم حفظ المظهر على هذا الجهاز فقط.", "Appearance was saved on this device only."));
    } catch {
      if (seq !== choiceSequence.current || token !== account.revision.current) return;
      setNotice(t("تم حفظ المظهر على هذا الجهاز فقط.", "Appearance was saved on this device only."));
    }
  }

  const activeChoice = choices.find((x) => x.value === theme) ?? choices[2];

  return (
    <div className="aura-theme-picker" ref={menu}>
      <button
        ref={trigger}
        type="button"
        className="top-icon"
        onClick={() => setOpen((x) => !x)}
        aria-label={t("تغيير المظهر: ", "Change appearance: ") + t(activeChoice.label, activeChoice.labelEn)}
        aria-haspopup="true"
        aria-expanded={open}
        title={t("المظهر: ", "Appearance: ") + t(activeChoice.label, activeChoice.labelEn)}
      >
        <Icon name={activeChoice.icon} size={19} />
      </button>

      {open && (
        <div
          className="aura-theme-menu"
          role="dialog"
          aria-label={t("استوديو الإضاءة والألوان", "Appearance & Palette Studio")}
        >
          <header className="aura-theme-heading">
            <span className="aura-theme-heading-title">
              <span className="aura-theme-heading-icon">
                <Icon name="sparkles" size={17} />
              </span>
              <strong>{t("نظام الإضاءة والمظهر", "Appearance System")}</strong>
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-label={t("إغلاق قائمة المظهر", "Close appearance menu")}
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <Icon name="close" size={16} />
            </button>
          </header>

          <p className="noata-theme-guidance">
            {activePalette === "midnight"
              ? t(
                  "طابع «منتصف الليل» داكن حصريًا؛ تم قفل الأوضاع النهارية لضمان التناسق البصري.",
                  "The Midnight palette is dark-only; light modes are locked for visual harmony."
                )
              : activeConstraint === "dark-only"
              ? t(
                  "تصميم Noäta AI الحالي مخصص للوضع الليلي حصريًا.",
                  "The active Noäta AI design is exclusively tailored for dark mode."
                )
              : activeConstraint === "light-only"
              ? t(
                  "تصميم Noäta AI الحالي مخصص للوضع النهاري حصريًا.",
                  "The active Noäta AI design is exclusively tailored for light mode."
                )
              : t(
                  "اختر وضع الإضاءة المفضل، ثم اختر عالم الألوان المناسب لتركيزك.",
                  "Choose your preferred illumination mode, then select your journey's color world."
                )}
          </p>

          <div
            className="aura-theme-options-list"
            role="radiogroup"
            aria-label={t("أوضاع الإضاءة", "Illumination modes")}
          >
            {choices.map((choice) => {
              const isAllowed = isThemeModeAllowed(choice.value, activePalette, activeConstraint);
              const isSelected = theme === choice.value;
              return (
                <button
                  type="button"
                  key={choice.value}
                  disabled={!isAllowed}
                  aria-disabled={!isAllowed}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => {
                    if (isAllowed) void choose(choice.value);
                  }}
                  className={[
                    "aura-mode-option",
                    isSelected ? "selected" : "",
                    !isAllowed ? "is-disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="aura-mode-icon-circle">
                    <Icon name={choice.icon} size={18} />
                  </span>
                  <span className="aura-mode-text">
                    <b>{t(choice.label, choice.labelEn)}</b>
                    <small>{t(choice.description, choice.descriptionEn)}</small>
                  </span>
                  {!isAllowed ? (
                    <span
                      className="aura-mode-locked-badge"
                      title={t(
                        "هذا الوضع غير متاح مع الطابع المختار",
                        "Locked for the selected palette"
                      )}
                    >
                      <Icon name="lock" size={11} />
                      <span>
                        {activePalette === "midnight" || activeConstraint === "dark-only"
                          ? t("ليلي فقط", "Dark only")
                          : t("نهاري فقط", "Light only")}
                      </span>
                    </span>
                  ) : isSelected ? (
                    <span className="aura-mode-active-pill" aria-hidden="true">
                      <span className="aura-mode-check-dot">
                        <Icon name="check" size={11} />
                      </span>
                      <span className="aura-mode-active-text">{t("مفعّل", "Active")}</span>
                    </span>
                  ) : (
                    <span className="aura-mode-radio-dot" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>

          <PaletteGallery compact />

          <a
            className="noata-theme-studio-link"
            href="/settings#noata-ai-design-studio"
            onClick={() => setOpen(false)}
          >
            <Icon name="sparkles" size={17} />
            <span>{t("ابتكر تصميمك الذكي مع Noäta AI", "Craft your design with Noäta AI")}</span>
            <Icon name="arrow" size={15} />
          </a>
        </div>
      )}

      {notice && (
        <span className="aura-theme-notice" role="status">
          {notice}
        </span>
      )}
    </div>
  );
}
