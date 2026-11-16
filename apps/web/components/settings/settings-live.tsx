"use client";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import { ThemeControl } from "@/components/preferences/theme-control";
import { PaletteGallery, syncBrowserThemeColor } from "@/components/preferences/palette-gallery";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { Icon } from "@/components/ui/icon";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { CHAT_MODEL_CARDS } from "@/lib/ai/model-routing";
import {
  resolveAppearance,
  isThemeModeAllowed,
  getActiveModeConstraint,
  type PaletteModeConstraint,
} from "@/lib/appearance/mode";
import {
  SERVER_REDUCED_MOTION_PREFIX,
  THEME_PREF_PREFIX,
  applyAndPersistMotionPreference,
  readScopedDevicePreference,
  readScopedMotionPreference,
  syncMotionDomAttributes,
  writeScopedDevicePreference,
} from "@/lib/appearance/device-preferences";
import { measureTokenContrast, normalizeCssColorToHex } from "@/lib/appearance/theme";
import {
  ALL_DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_PREFERENCES,
  moveWidgetOrder,
  parseDashboardPreferences,
  scopedDashboardPreferencesKey,
  serializeDashboardPreferences,
  toggleWidgetVisibility,
  type DashboardPreferences,
  type DashboardWidgetId,
} from "@/lib/dashboard/preferences";
import {
  mergeDashboardIntoExistingPreferences,
  mergeShellIntoDashboardPreferences,
  readScopedShellPreferences,
} from "@/lib/shell/sidebar-preferences";
import { DesignStudio } from "@/components/preferences/design-studio";
import { applyLocale, localized, useLocale } from "@/lib/i18n/locale";
import type { Json } from "@/lib/supabase/database.types";

type SettingsTabId = "appearance" | "profile" | "ai" | "account";

const WIDGET_LABELS: Record<DashboardWidgetId, { ar: string; en: string }> = {
  metrics: { ar: "مؤشرات التقدّم", en: "Learning Metrics" },
  consistency: { ar: "السلسلة والأهداف الأسبوعية", en: "Consistency & Weekly Goals" },
  next_steps: { ar: "الخطوات القادمة", en: "Next Recommended Steps" },
  weak_radar: { ar: "رادار نقاط التركيز", en: "Focus & Weak Radar" },
  curriculum: { ar: "استكشاف المنهج", en: "Curriculum Explorer" },
  quick_launcher: { ar: "الإطلاق السريع", en: "Quick Launcher" },
};

const SETTINGS_TAB_HASHES: Record<SettingsTabId, string> = {
  appearance: "aura-appearance",
  profile: "aura-profile",
  ai: "aura-ai",
  account: "aura-account",
};

function resolveTabFromHash(hash: string): SettingsTabId {
  const clean = hash.replace(/^#/, "").toLowerCase();
  if (clean === "aura-ai") return "ai";
  if (clean === "aura-profile" || clean === "aura-goals") return "profile";
  if (clean === "aura-security" || clean === "aura-account") return "account";
  return "appearance";
}

type Settings = {
  theme: "system" | "light" | "dark";
  locale: "ar" | "en";
  reduced_motion: boolean;
  default_ai_model: string;
  ai_memory_enabled: boolean;
};
const DEFAULT: Settings = {
  theme: "system",
  locale: "ar",
  reduced_motion: false,
  default_ai_model: "auto",
  ai_memory_enabled: true,
};
const MODEL_SUBTITLE_EN: Record<string, string> = {
  Fanar: "Everyday questions and conversation",
  "Fanar-S-1-7B": "Quick replies",
  "Fanar-C-1-8.7B": "Reasoning and explanations",
  "Fanar-C-2-27B": "Complex questions",
  "Fanar-Sadiq": "Islamic questions",
  "Fanar-Guard-2": "Safety and cultural-awareness screening",
  "Fanar-Diwan": "Original creative poetry",
  "Fanar-Oryx-IVU-2": "Image understanding",
};
type Notice = { kind: "success" | "error"; message: string };
function normalizeSettings(
  row: Record<string, unknown> | null,
  activeFallbackLocale: "ar" | "en" = "ar"
): Settings {
  const validModel =
    row?.default_ai_model === "auto" ||
    CHAT_MODEL_CARDS.some((m) => m.id === row?.default_ai_model);
  const preferredLocale =
    row?.locale === "en" || row?.locale === "ar" ? row.locale : activeFallbackLocale;
  return {
    theme:
      row?.theme === "dark" || row?.theme === "light" ? row.theme : "system",
    locale: preferredLocale,
    reduced_motion: row?.reduced_motion === true,
    default_ai_model: validModel ? String(row?.default_ai_model) : "auto",
    ai_memory_enabled: row?.ai_memory_enabled !== false,
  };
}
function applyThemeOnly(
  theme: "system" | "light" | "dark",
  explicitUserId?: string | null,
  persistLocal = true,
) {
  if (persistLocal) {
    writeScopedDevicePreference(THEME_PREF_PREFIX, theme, { userId: explicitUserId });
  }
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

function applyMotionOnly(
  reducedMotion: boolean,
  explicitUserId?: string | null,
  persistLocal = true,
) {
  if (typeof document === "undefined") return;
  const currentMotion = readScopedMotionPreference(explicitUserId);
  const nextMotion = reducedMotion
    ? (currentMotion === "off" ? "off" : "reduce")
    : (currentMotion === "reduce" ? "system" : currentMotion);
  if (!persistLocal) {
    syncMotionDomAttributes({
      mode: nextMotion,
      serverReducedMotion: reducedMotion,
    });
    return;
  }
  applyAndPersistMotionPreference(nextMotion, {
    userId: explicitUserId,
    serverReducedMotion: reducedMotion,
  });
}

function applySettings(settings: Settings, shouldSyncLocale = false, explicitUserId?: string | null) {
  applyThemeOnly(settings.theme, explicitUserId);
  if (shouldSyncLocale && typeof document !== "undefined" && settings.locale && settings.locale !== document.documentElement.lang) {
    applyLocale(settings.locale, true, explicitUserId);
  }
  applyMotionOnly(settings.reduced_motion, explicitUserId);
}

function GrandThemeGrid({
  currentTheme,
  activePalette,
  activeConstraint,
  systemDark,
  onSelectTheme,
  locale,
  t,
}: {
  currentTheme: "system" | "light" | "dark";
  activePalette: string;
  activeConstraint: PaletteModeConstraint;
  systemDark: boolean;
  onSelectTheme: (mode: "system" | "light" | "dark") => void;
  locale: "ar" | "en";
  t: (ar: string, en: string) => string;
}) {
  const cards = [
    {
      value: "light" as const,
      titleAr: "نهاري نقي",
      titleEn: "Pristine Light",
      descAr: "إضاءة واضحة وتبايُن فائق للخطوط مريح للمذاكرة في ضوء النهار.",
      descEn: "Clear, crisp illumination with high contrast optimized for daylight study.",
      icon: "sun",
      previewClass: "is-light",
    },
    {
      value: "dark" as const,
      titleAr: "ليلي مركّز",
      titleEn: "Deep Midnight",
      descAr: "خلفيات داكنة عميقة تحمي العين من الإجهاد وتقلل التشتت.",
      descEn: "Deep slate backgrounds eliminating glare for focused nighttime sessions.",
      icon: "moon",
      previewClass: "is-dark",
    },
    {
      value: "system" as const,
      titleAr: "تلقائي ذكي",
      titleEn: "System Adaptive",
      descAr: "يتكيف ديناميكيًا مع نظام تشغيل جهازك وتوقيت اليوم.",
      descEn: "Dynamically synchronizes with your device operating system theme.",
      icon: "screen",
      previewClass: "is-system",
    },
  ];

  return (
    <div
      className="aura-theme-grand-grid"
      role="group"
      aria-label={t("اختر وضع الإضاءة", "Choose illumination mode")}
    >
      {cards.map((o) => {
        const isAllowed = isThemeModeAllowed(o.value, activePalette, activeConstraint);
        const isSelected = currentTheme === o.value;
        return (
          <div
            key={o.value}
            className={`aura-theme-card ${isSelected ? "selected" : ""} ${!isAllowed ? "is-disabled" : ""}`}
            role="button"
            tabIndex={isAllowed ? 0 : -1}
            aria-pressed={isSelected}
            aria-disabled={!isAllowed}
            onClick={() => {
              if (isAllowed) onSelectTheme(o.value);
            }}
            onKeyDown={(e) => {
              if (e.key === " ") e.preventDefault();
              if (isAllowed && (e.key === "Enter" || e.key === " ")) {
                onSelectTheme(o.value);
              }
            }}
          >
            <div className="aura-theme-card-head">
              <span className="aura-theme-icon-wrap">
                <Icon name={o.icon} size={20} />
              </span>
              {!isAllowed ? (
                <span className="noata-theme-locked-pill">
                  <Icon name="lock" size={11} />
                  <span>
                    {activePalette === "midnight" || activeConstraint === "dark-only"
                      ? t("ليلي حصريًا", "Dark only")
                      : t("نهاري حصريًا", "Light only")}
                  </span>
                </span>
              ) : isSelected ? (
                <span className="noata-theme-selected-pill">
                  <span className="noata-check-dot">
                    <Icon name="check" size={11} />
                  </span>
                  <span>{t("مفعّل الآن", "Active")}</span>
                </span>
              ) : null}
            </div>

            <div className={`aura-theme-mini-screen ${o.previewClass}`} aria-hidden="true">
              <div className="noata-screen-topbar">
                <div className="noata-screen-dots">
                  <span className="dot dot-1" />
                  <span className="dot dot-2" />
                  <span className="dot dot-3" />
                </div>
                <span className="noata-screen-center-pill" />
                <span className="noata-screen-badge-mode">
                  {o.value === "light" ? "☀️" : o.value === "dark" ? "🌙" : "☀️/🌙"}
                </span>
              </div>

              <div className="noata-screen-layout">
                <div className="noata-screen-rail">
                  <span className="mini-rail-item is-active" />
                  <span className="mini-rail-item" />
                  <span className="mini-rail-item" />
                </div>

                <div className="noata-screen-workspace">
                  <div className="mini-workspace-header">
                    <span className="mini-title-line" />
                    <span className="mini-chip-pill" />
                  </div>
                  <div className="mini-workspace-card">
                    <div className="mini-card-row">
                      <span className="mini-card-text" />
                      <span className="mini-card-tag" />
                    </div>
                    <div className="mini-card-progress">
                      <div className="mini-card-bar" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="aura-theme-card-body">
              <div className="aura-theme-card-title-row">
                <strong>{locale === "en" ? o.titleEn : o.titleAr}</strong>
                {o.value === "system" && (
                  <span className="aura-system-os-badge">
                    {systemDark
                      ? t("نظامك ليلي 🌙", "OS: Dark 🌙")
                      : t("نظامك نهاري ☀️", "OS: Light ☀️")}
                  </span>
                )}
              </div>
              <small>{locale === "en" ? o.descEn : o.descAr}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
function LiveDesignSystemShowcase({
  locale,
  t,
}: {
  locale: "ar" | "en";
  t: (ar: string, en: string) => string;
}) {
  const [clickedAction, setClickedAction] = useState<string | null>(null);
  const [tokens, setTokens] = useState({
    accent: "#0065b5",
    onAccent: "#ffffff",
    surface: "#ffffff",
    ink: "#0a0a0a",
    muted: "#526072",
  });

  useEffect(() => {
    const updateTokens = () => {
      if (typeof window === "undefined") return;
      const cs = window.getComputedStyle(document.documentElement);
      const readHex = (prop: string, fallback: string) => {
        const raw = cs.getPropertyValue(prop).trim();
        return normalizeCssColorToHex(raw) ?? (raw || fallback);
      };
      setTokens({
        accent: readHex("--accent", "#0065b5"),
        onAccent: readHex("--on-accent", "#ffffff"),
        surface: readHex("--surface", "#ffffff"),
        ink: readHex("--ink", "#0a0a0a"),
        muted: readHex("--muted", "#526072"),
      });
    };
    updateTokens();
    window.addEventListener("noata-palette-change", updateTokens);
    window.addEventListener("noata-custom-theme-change", updateTokens);
    const observer = new MutationObserver(updateTokens);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette", "style"],
    });
    return () => {
      window.removeEventListener("noata-palette-change", updateTokens);
      window.removeEventListener("noata-custom-theme-change", updateTokens);
      observer.disconnect();
    };
  }, []);

  const inkContrast = measureTokenContrast(tokens.ink, tokens.surface);
  const mutedContrast = measureTokenContrast(tokens.muted, tokens.surface);
  const accentBtnContrast = measureTokenContrast(tokens.onAccent, tokens.accent);

  const triggerFeedback = (name: string) => {
    setClickedAction(name);
    setTimeout(() => {
      setClickedAction((cur) => (cur === name ? null : cur));
    }, 2400);
  };

  return (
    <div
      className="aura-design-system-preview"
      role="region"
      aria-label={t("معاينة نظام التصميم", "Design System Showcase")}
    >
      {/* Signature Showcase Header */}
      <div className="aura-preview-header">
        <div className="aura-preview-title-wrap">
          <span className="aura-preview-icon-badge">
            <Icon name="sliders" size={18} />
          </span>
          <div>
            <h4>{t("معاينة حية وتفاعلية لمكونات Noäta Aura", "Interactive Live Component Showcase")}</h4>
            <p className="aura-preview-desc">
              {t(
                "استجابة فورية للألوان، حالات التفاعل، وبطاقات المحتوى تتكيف بدقة لحظية مع أي مظهر وعالم ألوان تختاره.",
                "Real-time preview of buttons, badges, curriculum cards, and contrast tokens adapting dynamically."
              )}
            </p>
          </div>
        </div>

        <div className="aura-preview-header-tags">
          <span className="noata-ds-live-tag">
            <span className="pulse-dot" aria-hidden="true" />
            <span>{t("تحديث فوري", "Instant Live")}</span>
          </span>
          <span className="noata-ds-contrast-tag">
            <Icon name="shield" size={12} />
            <span>{t("معاينة تباين فقط", "Contrast preview only")}</span>
          </span>
        </div>
      </div>

      {/* 4 Executive Pillars Grid */}
      <div className="aura-preview-grid-pillars">
        {/* Pillar 1: Interactive Buttons */}
        <div className="aura-preview-pillar">
          <div className="aura-preview-pillar-header">
            <span className="aura-pillar-icon">
              <Icon name="zap" size={14} />
            </span>
            <span className="aura-preview-group-label">
              {t("الأزرار التفاعلية", "Interactive Actions")}
            </span>
          </div>

          <div className="aura-preview-pillar-content">
            <div className="aura-preview-buttons-stack">
              <button
                type="button"
                className="noata-ds-btn noata-ds-btn-primary"
                onClick={() => triggerFeedback(t("الزر الأساسي (Primary)", "Primary Action"))}
              >
                <Icon name="zap" size={15} />
                <span>{t("زر أساسي تفاعلي", "Primary Action")}</span>
              </button>

              <button
                type="button"
                className="noata-ds-btn noata-ds-btn-secondary"
                onClick={() => triggerFeedback(t("الزر الثانوي الناعم (Secondary)", "Secondary Action"))}
              >
                <Icon name="sparkles" size={15} />
                <span>{t("زر ثانوي ناعم", "Secondary Action")}</span>
              </button>

              <button
                type="button"
                className="noata-ds-btn noata-ds-btn-outline"
                onClick={() => triggerFeedback(t("الزر الإطاري (Outline)", "Outline Action"))}
              >
                <Icon name="ai" size={15} />
                <span>{t("زر إطاري", "Ghost Action")}</span>
              </button>
            </div>
            <small className="noata-ds-pillar-note">
              {t("اضغط على أي زر لتجربة التفاعل والرسائل اللحظية.", "Click any action to test live tactile response.")}
            </small>
          </div>
        </div>

        {/* Pillar 2: Status & Mastery Badges */}
        <div className="aura-preview-pillar">
          <div className="aura-preview-pillar-header">
            <span className="aura-pillar-icon">
              <Icon name="award" size={14} />
            </span>
            <span className="aura-preview-group-label">
              {t("شارات الإتقان والحالة", "Mastery & Status Badges")}
            </span>
          </div>

          <div className="aura-preview-pillar-content">
            <div className="aura-preview-badges-wrap">
              <button
                type="button"
                className="noata-ds-pill noata-ds-pill-success"
                onClick={() => triggerFeedback(t("شارة الإتقان 100%", "100% Mastery"))}
              >
                <span className="noata-pill-check-icon">
                  <Icon name="check" size={11} />
                </span>
                <span>{t("مكتمل ومتقن", "Mastered 100%")}</span>
              </button>

              <button
                type="button"
                className="noata-ds-pill noata-ds-pill-ai"
                onClick={() => triggerFeedback(t("شارة ذكاء Noäta", "Noäta AI"))}
              >
                <Icon name="sparkles" size={13} />
                <span>{t("ذكاء Noäta", "Noäta AI")}</span>
              </button>

              <button
                type="button"
                className="noata-ds-pill noata-ds-pill-streak"
                onClick={() => triggerFeedback(t("شارة النشاط المستمر", "Daily Streak"))}
              >
                <Icon name="flame" size={13} />
                <span>{t("نشاط مستمر 7 أيام", "7-Day Streak")}</span>
              </button>

              <button
                type="button"
                className="noata-ds-pill noata-ds-pill-challenge"
                onClick={() => triggerFeedback(t("شارة تحدّي الوحدة", "Boss Challenge"))}
              >
                <Icon name="shield" size={13} />
                <span>{t("تحدّي الوحدة", "Unit Boss")}</span>
              </button>
            </div>
            <small className="noata-ds-pillar-note">
              {t("شارات مصممة بأيقونات SVG موجهة ومتباينة بالكامل.", "Badges oriented cleanly in Arabic RTL & English LTR.")}
            </small>
          </div>
        </div>

        {/* Pillar 3: Curriculum Specimen Card */}
        <div className="aura-preview-pillar">
          <div className="aura-preview-pillar-header">
            <span className="aura-pillar-icon">
              <Icon name="book" size={14} />
            </span>
            <span className="aura-preview-group-label">
              {t("نموذج بطاقة الدرس المنهجي", "Curriculum Card Specimen")}
            </span>
          </div>

          <div className="aura-preview-pillar-content">
            <div className="noata-ds-specimen-card">
              <div className="noata-ds-specimen-head">
                <div className="noata-ds-specimen-titles">
                  <strong>{t("العلوم المتكاملة · الوحدة الأولى", "Integrated Science · Unit 1")}</strong>
                  <small>{t("مفاهيم التوازن البيئي والطاقة", "Ecosystem Balance & Energy")}</small>
                </div>
                <span className="noata-ds-specimen-track-pill">{t("مسار ثنائي عربي / EN", "AR / EN")}</span>
              </div>

              <div className="noata-ds-progress-track">
                <div className="noata-ds-progress-bar" style={{ width: "92%" }} />
              </div>

              <div className="noata-ds-specimen-footer">
                <div className="noata-ds-specimen-stat">
                  <small>{t("نسبة الإتقان المحققة", "Current Mastery")}</small>
                  <b>92%</b>
                </div>
                <button
                  type="button"
                  className="noata-ds-specimen-btn"
                  onClick={() => triggerFeedback(t("متابعة الدرس المنهجي", "Continue Lesson"))}
                >
                  <span>{t("متابعة الدرس", "Continue")}</span>
                  <Icon name="arrow-end" size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar 4: Live Tokens & Contrast Inspector */}
        <div className="aura-preview-pillar">
          <div className="aura-preview-pillar-header">
            <span className="aura-pillar-icon">
              <Icon name="palette" size={14} />
            </span>
            <span className="aura-preview-group-label">
              {t("محلل رموز الألوان والتباين", "Live Contrast & Tokens")}
            </span>
          </div>

          <div className="aura-preview-pillar-content">
            <div className="noata-ds-swatches-row">
              <div className="noata-ds-swatch-item">
                <span className="noata-ds-color-circle" style={{ backgroundColor: tokens.accent }} />
                <div className="noata-ds-swatch-meta">
                  <b>{t("اللون الأساسي", "Accent")}</b>
                  <code dir="ltr">{tokens.accent}</code>
                </div>
              </div>

              <div className="noata-ds-swatch-item">
                <span className="noata-ds-color-circle" style={{ backgroundColor: tokens.surface }} />
                <div className="noata-ds-swatch-meta">
                  <b>{t("السطح والخلفية", "Surface")}</b>
                  <code dir="ltr">{tokens.surface}</code>
                </div>
              </div>

              <div className="noata-ds-swatch-item">
                <span className="noata-ds-color-circle" style={{ backgroundColor: tokens.ink }} />
                <div className="noata-ds-swatch-meta">
                  <b>{t("النصوص الرئيسية", "Ink")}</b>
                  <code dir="ltr">{tokens.ink}</code>
                </div>
              </div>
            </div>

            <div className="noata-ds-contrast-banner" role="status">
              <span className="noata-ds-contrast-check">
                <Icon name="check" size={12} />
              </span>
              <span className="noata-ds-contrast-metrics">
                {t("قياس تباين WCAG الفعلي للرموز النشطة:", "Live WCAG contrast for active tokens:")}{" "}
                <b dir="ltr">
                  {inkContrast
                    ? `${t("النص/السطح", "Ink/Surface")} ${inkContrast.ratio.toFixed(2)}:1 (${inkContrast.passAAA ? "AAA" : inkContrast.passAA ? "AA" : "Fail"})`
                    : "Ink/Surface —"}
                </b>
                {" · "}
                <b dir="ltr">
                  {accentBtnContrast
                    ? `${t("زر الأساس", "Button")} ${accentBtnContrast.ratio.toFixed(2)}:1 (${accentBtnContrast.passAAA ? "AAA" : accentBtnContrast.passAA ? "AA" : "Fail"})`
                    : "Button —"}
                </b>
                {" · "}
                <b dir="ltr">
                  {mutedContrast
                    ? `${t("الثانوي/السطح", "Muted/Surface")} ${mutedContrast.ratio.toFixed(2)}:1 (${mutedContrast.passAAA ? "AAA" : mutedContrast.passAA ? "AA" : "Fail"})`
                    : "Muted/Surface —"}
                </b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {clickedAction && (
        <div className="noata-ds-interactive-toast" role="status">
          <Icon name="check" size={14} />
          <span>
            {t(
              `تم اختبار التفاعل بنجاح مع «${clickedAction}» بالألوان والرموز النشطة!`,
              `Successfully triggered “${clickedAction}” using active design tokens!`
            )}
          </span>
        </div>
      )}
    </div>
  );
}

export function SettingsLive() {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const supabase = useMemo(() => createClient(), []);
  const { account, run, status, busy: mutating } = useConfirmedMutation();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT);
  const [dashPrefs, setDashPrefs] = useState<DashboardPreferences>(DEFAULT_DASHBOARD_PREFERENCES);
  const [activeTab, setActiveTab] = useState<SettingsTabId>("appearance");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [password, setPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [securityNotice, setSecurityNotice] = useState<Notice | null>(null);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [reload, setReload] = useState(0);
  const [activePalette, setActivePalette] = useState("classic");
  const [activeConstraint, setActiveConstraint] = useState<PaletteModeConstraint>("both");
  const [systemDark, setSystemDark] = useState(false);
  const rawDashPrefsRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(m.matches);
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const sync = () => {
      if (typeof document === "undefined") return;
      const curPalette = document.documentElement.dataset.palette || "classic";
      const curConstraint = getActiveModeConstraint();
      setActivePalette(curPalette);
      setActiveConstraint(curConstraint);

      setSettings((prev) => {
        if (!isThemeModeAllowed(prev.theme, curPalette, curConstraint)) {
          const fallback: "light" | "dark" = curConstraint === "light-only" ? "light" : "dark";
          const updated = { ...prev, theme: fallback };
          applyThemeOnly(fallback);
          return updated;
        }
        return prev;
      });
    };
    sync();
    window.addEventListener("noata-palette-change", sync);
    window.addEventListener("noata-custom-theme-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("noata-palette-change", sync);
      window.removeEventListener("noata-custom-theme-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (account.loading) return;
    let active = true;
    setUserId("");
    setEmail("");
    setName("");
    let localTheme: "system" | "light" | "dark" = "system";
    const stored = readScopedDevicePreference(THEME_PREF_PREFIX, {
      userId: account.user?.id ?? null,
      legacyKey: "noata-theme",
    });
    if (stored === "light" || stored === "dark" || stored === "system") localTheme = stored;
    const curPal = typeof document !== "undefined" ? document.documentElement.dataset.palette : "classic";
    const curCons = getActiveModeConstraint();
    if (!isThemeModeAllowed(localTheme, curPal, curCons)) {
      localTheme = curCons === "light-only" ? "light" : "dark";
    }
    setSettings({ ...DEFAULT, theme: localTheme, locale: locale === "en" ? "en" : "ar" });
    setInitial("");
    setPassword("");
    setNotice(null);
    setSecurityNotice(null);
    setSaving(false);
    setPasswordBusy(false);
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const user = account.user;
        if (!active) return;
        if (!user) {
          setUserId("");
          return;
        }
        setUserId(user.id);
        setEmail(user.email ?? "");
        const [profile, preferences] = await Promise.all([
          supabase
            .from("profiles")
            .select("display_name,preferred_language")
            .eq("id", user.id)
            .single(),
          supabase
            .from("user_settings")
            .select(
              "theme,locale,reduced_motion,default_ai_model,ai_memory_enabled,dashboard_preferences",
            )
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);
        if (profile.error || preferences.error)
          throw profile.error ?? preferences.error;
        if (!active) return;
        const fallbackLoc =
          typeof document !== "undefined" && document.documentElement.lang === "en"
            ? "en"
            : "ar";
        const next = normalizeSettings(
          preferences.data as Record<string, unknown> | null,
          fallbackLoc
        );
        let storedDashRaw: unknown = preferences.data?.dashboard_preferences;
        rawDashPrefsRef.current = storedDashRaw ?? null;
        if (!storedDashRaw) {
          try {
            const localRaw = localStorage.getItem(scopedDashboardPreferencesKey(user.id));
            if (localRaw) storedDashRaw = JSON.parse(localRaw);
          } catch {}
        }
        const nextDashPrefs = parseDashboardPreferences(storedDashRaw);
        writeScopedDevicePreference(
          SERVER_REDUCED_MOTION_PREFIX,
          next.reduced_motion ? "true" : "false",
          { userId: user.id },
        );
        syncMotionDomAttributes({
          mode: readScopedMotionPreference(user.id),
          serverReducedMotion: next.reduced_motion,
        });
        const displayName = profile.data?.display_name ?? "";
        setName(displayName);
        setSettings(next);
        setDashPrefs(nextDashPrefs);
        setInitial(JSON.stringify({ name: displayName, settings: next, dashPrefs: nextDashPrefs }));
      } catch {
        if (active) {
          const errLoc =
            typeof document !== "undefined" && document.documentElement.lang === "en"
              ? "en"
              : "ar";
          setError(
            localized(
              errLoc,
              "تعذّر تحميل إعدادات حسابك. حاول مجددًا بعد التحقق من الاتصال.",
              "Could not load your account settings. Check your connection and try again.",
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, reload, account.user, account.loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const syncHash = () => {
      if (window.location.hash) {
        setActiveTab(resolveTabFromHash(window.location.hash));
      }
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const handleSelectTab = useCallback((nextId: string) => {
    const resolved: SettingsTabId =
      nextId === "profile" || nextId === "ai" || nextId === "account"
        ? nextId
        : "appearance";
    setActiveTab(resolved);
    if (typeof window !== "undefined") {
      const targetHash = `#${SETTINGS_TAB_HASHES[resolved]}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, "", targetHash);
      }
    }
  }, []);

  const dirty = JSON.stringify({ name, settings, dashPrefs }) !== initial;
  useUnsavedWork(Boolean(userId && dirty));
  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!userId || saving || mutating) return;
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setNotice({
        kind: "error",
        message: t("يجب أن يكون اسم العرض بين حرفين و٨٠ حرفًا.","Your display name must be between 2 and 80 characters."),
      });
      return;
    }
    setSaving(true);
    setNotice(null);
    const token = account.revision.current;
    const cleanDashPrefs = parseDashboardPreferences(dashPrefs);
    const serializedDashPrefs = serializeDashboardPreferences(cleanDashPrefs);
    const liveShell = readScopedShellPreferences(
      typeof window !== "undefined" ? window.localStorage : null,
      userId,
    );
    const mergedDashPrefsPayload = liveShell
      ? mergeShellIntoDashboardPreferences(
          mergeDashboardIntoExistingPreferences(rawDashPrefsRef.current, serializedDashPrefs),
          liveShell,
        )
      : mergeDashboardIntoExistingPreferences(rawDashPrefsRef.current, serializedDashPrefs);
    await run(async (check) => {
      try {
        // Two distinct RLS-protected records. Never report success if either write fails.
        const profileResult = await supabase
          .from("profiles")
          .update({
            display_name: cleanName,
            preferred_language: settings.locale,
          })
          .eq("id", userId)
          .select("id")
          .single();
        check();
        if (profileResult.error)
           throw Error(t("تعذّر تحديث الملف الشخصي. لم تُحفظ كل الإعدادات.","Could not update your profile. Some settings were not saved."));
        const settingResult = await supabase
          .from("user_settings")
          .upsert(
            {
              user_id: userId,
              ...settings,
              dashboard_preferences: mergedDashPrefsPayload as Json,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          )
          .select("user_id")
          .single();
        check();
        if (settingResult.error)
          throw Error(
             t("تم حفظ الاسم، لكن تفضيلات الجهاز والذكاء الاصطناعي لم تُحفظ. حاول مرة أخرى.","Your name was saved, but your device and AI preferences were not. Please try again."),
          );
        rawDashPrefsRef.current = mergedDashPrefsPayload;
        try {
          localStorage.setItem(
            scopedDashboardPreferencesKey(userId),
            JSON.stringify(serializedDashPrefs),
          );
        } catch {}
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("noata-dashboard-preferences-change"));
        }
        applySettings(settings, true, userId);
        setName(cleanName);
        setDashPrefs(cleanDashPrefs);
        setInitial(JSON.stringify({ name: cleanName, settings, dashPrefs: cleanDashPrefs }));
        setNotice({
          kind: "success",
           message: t("تم حفظ إعداداتك في حسابك بنجاح.","Your settings were saved to your account."),
        });
      } catch (err) {
        check();
        setNotice({
          kind: "error",
           message: err instanceof Error ? err.message : t("تعذّر حفظ الإعدادات.","Could not save your settings."),
        });
      }
    }, "");
    if (token === account.revision.current) setSaving(false);
  }
  async function updatePassword() {
    if (passwordBusy || mutating) return;
    if (password.length < 8) {
      setSecurityNotice({
        kind: "error",
         message: t("اكتب كلمة مرور مكوّنة من ٨ أحرف على الأقل.","Enter a password with at least 8 characters."),
      });
      return;
    }
    setPasswordBusy(true);
    setSecurityNotice(null);
    const token = account.revision.current;
    await run(async (check) => {
      try {
        const { error } = await supabase.auth.updateUser({ password });
        check();
        if (error) throw error;
        setPassword("");
        setSecurityNotice({
          kind: "success",
           message: t("تم تحديث كلمة المرور. حافظ عليها في مكان آمن.","Password updated. Keep it somewhere safe."),
        });
      } catch {
        check();
        setSecurityNotice({
          kind: "error",
           message: t("تعذّر تحديث كلمة المرور. قد تحتاج لتسجيل الدخول مجددًا.","Could not update your password. You may need to sign in again."),
        });
      }
    }, "");
    if (token === account.revision.current) setPasswordBusy(false);
  }
  async function logoutFromSettings() {
    if (!userId || logoutBusy || saving || mutating) return;
    const revision = account.revision.current;
    const approved = await confirmAction({
       title: t("تسجيل الخروج من Noata؟","Sign out of Noata?"),
      description: dirty
         ? t("لديك تغييرات غير محفوظة في إعدادات الحساب. سيؤدي تسجيل الخروج إلى فقد هذه التغييرات.","You have unsaved account settings. Signing out will discard those changes.")
         : t("يمكنك العودة في أي وقت وتسجيل الدخول إلى حسابك لاستكمال رحلتك.","You can sign back in whenever you are ready to continue."),
       confirmLabel: t("تسجيل الخروج","Sign out"),
       cancelLabel: t("البقاء في حسابي","Stay signed in"),
      tone: "danger",
      icon: "user",
    });
    if (!approved || revision !== account.revision.current) return;
    setLogoutBusy(true);
    setLogoutError("");
    try {
      const result = await supabase.auth.signOut();
      if (result.error) throw result.error;
      // Successful sign-out is independent of preference-saving state.
      window.location.assign("/login");
    } catch {
       setLogoutError(t("لم يكتمل تسجيل الخروج. تحقّق من الاتصال وحاول مرة أخرى.","Could not sign out. Check your connection and try again."));
      setLogoutBusy(false);
    }
  }
  if (account.error)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>
           {t("إعادة المحاولة", "Try again")}
        </button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="aura-settings-state" role="status">
        <Icon name="settings" size={29} />
         <h1>{t("جارٍ تحميل إعداداتك…", "Loading your settings…")}</h1>
         <p>{t("البيانات مرتبطة بحسابك الشخصي.", "These settings belong to your account.")}</p>
      </section>
    );
  if (error)
    return (
      <section className="aura-settings-state" role="alert">
         <h1>{t("في مشكلة في تحميل الإعدادات", "Could not load settings")}</h1>
        <p>{error}</p>
        <button type="button" onClick={() => setReload((n) => n + 1)}>
           {t("حاول مرة أخرى", "Try again")}
        </button>
      </section>
    );
  if (!userId)
    return (
      <div className="aura-settings-guest-view" style={{ maxWidth: 960, marginInline: "auto", display: "grid", gap: 24, width: "100%" }}>
        <ModuleWelcome
           title={t("مساحتك، بطريقتك.", "Your space, your way.")}
           description={t("احفظ تفضيلات القراءة والذكاء الاصطناعي بين الأجهزة. المظهر متاح الآن على هذا الجهاز؛ بقية التفضيلات تحتاج حسابك.", "Save your reading and AI preferences across devices. Appearance works on this device now; other preferences require an account.")}
           eyebrow={t("صمّم تجربتك", "Shape your experience")}
          icon="settings"
          route="/settings"
           steps={[t("اختر المظهر المريح", "Choose a comfortable appearance"), t("خصّص تفضيلات المساعد", "Set your AI preferences"), t("احمِ حسابك", "Protect your account")]}
        />
        <section className="aura-device-appearance">
          <div>
            <h2>{t("مظهر هذا الجهاز", "Appearance on this device")}</h2>
            <p>{t("جرّب الوضع النهاري، الليلي أو تلقائيًا حسب جهازك.", "Choose light, dark, or your device's default appearance.")}</p>
          </div>
          <ThemeControl />
        </section>
        <DesignStudio />
      </div>
    );

  const saveBar = (
    <>
      <div className="aura-settings-savebar">
        <div>
          <strong>
            {dirty
              ? t("عندك تغييرات لسه متحفظتش", "You have unsaved changes")
              : t("تفضيلاتك الحالية", "Your current preferences")}
          </strong>
          <small>
            {t(
              "الحفظ يتأكد من تحديث حسابك قبل ظهور رسالة النجاح.",
              "A success message appears only after your account confirms the update.",
            )}
          </small>
        </div>
        <button type="submit" disabled={!dirty || saving}>
          {saving ? t("جارٍ الحفظ…", "Saving…") : t("حفظ التغييرات", "Save changes")}
        </button>
      </div>
      {notice && (
        <div
          className={"aura-settings-notice " + notice.kind}
          role={notice.kind === "error" ? "alert" : "status"}
        >
          {notice.message}
        </div>
      )}
    </>
  );

  const settingsTabs: TabItem[] = [
    {
      id: "appearance",
      label: t("المظهر والتصميم", "Appearance & Studio"),
      icon: "sun",
      content: (
        <>
          <form className="aura-settings-content" onSubmit={(e) => void save(e)}>
            <section id="aura-appearance" className="aura-settings-section" data-tour="settings-appearance">
              <div className="aura-settings-section-top">
                <Icon name="sun" size={24} />
                <div>
                  <h2>{t("استوديو المظهر ونظام التصميم", "Appearance Studio & Design System")}</h2>
                  <p>
                    {t(
                      "تحكم كامل في إضاءة المنصة، عوالم الألوان، تفضيلات الحركة، ومعاينة حية لمكونات النظام البصري.",
                      "Full control over platform illumination, color worlds, motion preferences, and a live design system preview."
                    )}
                  </p>
                </div>
              </div>

              <GrandThemeGrid
                currentTheme={settings.theme}
                activePalette={activePalette}
                activeConstraint={activeConstraint}
                systemDark={systemDark}
                onSelectTheme={(mode) => {
                  setSettings((s) => ({ ...s, theme: mode }));
                  applyThemeOnly(mode, userId || null, !userId);
                }}
                locale={locale}
                t={t}
              />

              <PaletteGallery />

              <p className="noata-appearance-footnote">
                {activePalette === "midnight"
                  ? t(
                      "طابع «منتصف الليل» يفرض الوضع الليلي حصريًا لحماية عمق الدرجات الليلية والتباين المريح.",
                      "The Midnight palette strictly enforces Dark Mode to protect night-time contrast and depth."
                    )
                  : activeConstraint === "dark-only"
                  ? t(
                      "تصميم Noäta AI المخصص يفرض الوضع الليلي حصريًا بناءً على ألوانه وتناغم التباين المعتمد.",
                      "The active Noäta AI design strictly enforces Dark Mode based on its calibrated contrast."
                    )
                  : activeConstraint === "light-only"
                  ? t(
                      "تصميم Noäta AI المخصص يفرض الوضع النهاري حصريًا.",
                      "The active Noäta AI design strictly enforces Light Mode."
                    )
                  : t(
                      "الأوضاع النهارية والليلية تعمل بتناغم تام مع كافة عوالم الألوان؛ طابع «منتصف الليل» داكن بطبيعته.",
                      "Light and dark modes operate alongside color worlds. The Midnight palette remains deep dark."
                    )}
              </p>

              <LiveDesignSystemShowcase locale={locale} t={t} />

              <label className="aura-settings-switch">
                <span>
                  <strong>{t("تقليل الحركة والانتقالات", "Reduce Motion & Transitions")}</strong>
                  <small>
                    {t(
                      "إيقاف التأثيرات الحركية والتحولات السريعة لتجربة قراءة هادئة.",
                      "Limit animated transitions for a calmer reading experience."
                    )}
                  </small>
                </span>
                <input
                  type="checkbox"
                  checked={settings.reduced_motion}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSettings((s) => ({ ...s, reduced_motion: checked }));
                    applyMotionOnly(checked, userId || null, !userId);
                  }}
                />
              </label>
            </section>
            {saveBar}
          </form>
          <DesignStudio />
        </>
      ),
    },
    {
      id: "profile",
      label: t("الملف الشخصي والأهداف", "Profile & Goals"),
      icon: "settings",
      content: (
        <form className="aura-settings-content" onSubmit={(e) => void save(e)}>
          <section id="aura-profile" className="aura-settings-section">
            <div className="aura-settings-section-top">
              <Icon name="settings" size={21} />
              <div>
                <h2>{t("الملف الشخصي وأهداف لوحة التحكم", "Profile & Dashboard Goals")}</h2>
                <p>{t("الاسم واللغة الأساسية والأهداف الأسبوعية وترتيب بطاقات الرئيسية", "Your name, interface language, weekly study targets, and dashboard widgets")}</p>
              </div>
            </div>
            <label className="aura-settings-label">
              <span>{t("اسم العرض", "Display name")}</span>
              <input
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("اسمك داخل Noäta", "Your name in Noata")}
              />
            </label>
            <label className="aura-settings-label">
              <span>{t("لغة الواجهة", "Interface language")}</span>
              <select
                value={settings.locale}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    locale: e.target.value === "en" ? "en" : "ar",
                  }))
                }
              >
                <option value="ar">{t("العربية — الواجهة الأساسية", "Arabic")}</option>
                <option value="en">{t("English — جزئية", "English — partial")}</option>
              </select>
              <small>{t("بعض الصفحات ما زالت عربية حتى عند اختيار الإنجليزية.", "Some pages still appear in Arabic when English is selected.")}</small>
            </label>

            <div id="aura-goals" className="noata-settings-subpanel">
              <h3>{t("أهداف التعلم الأسبوعية", "Weekly learning goals")}</h3>
              <div className="noata-settings-goals-grid">
                <label className="aura-settings-label">
                  <span>{t("هدف البطاقات أسبوعيًا", "Weekly cards target")}</span>
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={dashPrefs.goals.weeklyCardsTarget}
                    onChange={(e) =>
                      setDashPrefs((p) =>
                        parseDashboardPreferences({
                          ...p,
                          goals: { ...p.goals, weeklyCardsTarget: Number(e.target.value) || p.goals.weeklyCardsTarget },
                        }),
                      )
                    }
                  />
                </label>
                <label className="aura-settings-label">
                  <span>{t("هدف الدروس أسبوعيًا", "Weekly lessons target")}</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={dashPrefs.goals.weeklyLessonsTarget}
                    onChange={(e) =>
                      setDashPrefs((p) =>
                        parseDashboardPreferences({
                          ...p,
                          goals: { ...p.goals, weeklyLessonsTarget: Number(e.target.value) || p.goals.weeklyLessonsTarget },
                        }),
                      )
                    }
                  />
                </label>
              </div>
            </div>

            <div className="noata-settings-subpanel">
              <h3>{t("ظهور وترتيب بطاقات الرئيسية", "Dashboard widgets order & visibility")}</h3>
              <div className="noata-settings-widgets-list">
                {dashPrefs.widgetOrder.map((id, idx) => {
                  const visible = !dashPrefs.hiddenWidgets.includes(id);
                  const copy = WIDGET_LABELS[id] ?? { ar: id, en: id };
                  return (
                    <div key={id} className="noata-settings-widget-row">
                      <label className="noata-settings-widget-toggle">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={() => setDashPrefs((p) => toggleWidgetVisibility(p, id))}
                        />
                        <span>{t(copy.ar, copy.en)}</span>
                      </label>
                      <div className="noata-settings-widget-actions">
                        <button
                          type="button"
                          disabled={idx === 0}
                          aria-label={t(`تحريك ${copy.ar} لأعلى`, `Move ${copy.en} up`)}
                          onClick={() => setDashPrefs((p) => moveWidgetOrder(p, id, "up"))}
                        >
                          {t("أعلى", "Up")}
                        </button>
                        <button
                          type="button"
                          disabled={idx === ALL_DASHBOARD_WIDGET_IDS.length - 1}
                          aria-label={t(`تحريك ${copy.ar} لأسفل`, `Move ${copy.en} down`)}
                          onClick={() => setDashPrefs((p) => moveWidgetOrder(p, id, "down"))}
                        >
                          {t("أسفل", "Down")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
          {saveBar}
        </form>
      ),
    },
    {
      id: "ai",
      label: "Noäta AI",
      icon: "ai",
      content: (
        <form className="aura-settings-content" onSubmit={(e) => void save(e)}>
          <section id="aura-ai" className="aura-settings-section" data-tour="settings-ai">
            <div className="aura-settings-section-top">
              <Icon name="ai" size={21} />
              <div>
                <h2>Noäta AI</h2>
                <p>{t("اختر تفضيلات الدردشة والنماذج المهيأة", "Choose chat and model preferences")}</p>
              </div>
            </div>
            <label className="aura-settings-label">
              <span>{t("نموذج الذكاء الاصطناعي الافتراضي", "Default AI model")}</span>
              <select
                value={settings.default_ai_model}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, default_ai_model: e.target.value }))
                }
              >
                <option value="auto">{t("تلقائي · توجيه حسب نوع السؤال", "Auto · selected by question type")}</option>
                {CHAT_MODEL_CARDS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {locale === "en" ? o.id : o.arabic} · {locale === "en" ? MODEL_SUBTITLE_EN[o.id] : o.subtitle}
                  </option>
                ))}
              </select>
              <small>
                {t("وجود النموذج في القائمة يعني أنه مهيّأ؛ توفّره الفعلي يعتمد على الخدمة.", "Listed models are configured; actual availability depends on the provider.")}
              </small>
            </label>
            <label className="aura-settings-switch">
              <span>
                <strong>{t("حفظ محادثات الذكاء الاصطناعي", "Save AI conversations")}</strong>
                <small>
                  {t("عند إيقافها تستخدم المحادثات الجديدة الوضع المؤقت. لا تُحذف المحادثات القديمة تلقائيًا.", "When off, new chats use temporary mode. Existing conversations are not deleted automatically.")}
                </small>
              </span>
              <input
                type="checkbox"
                checked={settings.ai_memory_enabled}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    ai_memory_enabled: e.target.checked,
                  }))
                }
              />
            </label>
          </section>
          {saveBar}
        </form>
      ),
    },
    {
      id: "account",
      label: t("الأمان والحساب", "Security & Account"),
      icon: "user",
      content: (
        <div className="aura-settings-content">
          <section
            id="aura-security"
            className="aura-settings-section aura-settings-security"
          >
            <div className="aura-settings-section-top">
              <Icon name="pin" size={21} />
              <div>
                <h2>{t("حماية الحساب", "Account security")}</h2>
                <p>{t("تغيير كلمة المرور بشكل مستقل عن بقية التفضيلات", "Change your password separately from other settings")}</p>
              </div>
            </div>
            <label className="aura-settings-label">
              <span>{t("كلمة مرور جديدة", "New password")}</span>
              <span className="aura-settings-password">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  aria-invalid={password.length > 0 && password.length < 8}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void updatePassword();
                    }
                  }}
                  placeholder={t("٨ أحرف على الأقل", "At least 8 characters")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((x) => !x)}
                  aria-label={
                    showPassword ? t("إخفاء كلمة المرور", "Hide password") : t("إظهار كلمة المرور", "Show password")
                  }
                >
                  {showPassword ? t("إخفاء", "Hide") : t("إظهار", "Show")}
                </button>
              </span>
            </label>
            <button
              type="button"
              className="aura-settings-password-action"
              disabled={password.length < 8 || passwordBusy}
              onClick={() => void updatePassword()}
            >
              {passwordBusy ? t("جارٍ التحديث…", "Updating…") : t("تحديث كلمة المرور", "Update password")}
            </button>
            {securityNotice && (
              <p
                role={securityNotice.kind === "error" ? "alert" : "status"}
                className={"aura-settings-notice " + securityNotice.kind}
              >
                {securityNotice.message}
              </p>
            )}
            <p className="aura-settings-security-foot">
              {t("لا تشارك كلمة المرور مع أي شخص. صلاحيات حسابك تتحكم فيها سياسات قاعدة البيانات على الخادم، وليس هذه الصفحة.", "Never share your password. Server-side database policies control account permissions.")}
            </p>
          </section>
          <section id="aura-account" className="aura-settings-section aura-settings-account" data-tour="settings-account">
            <div className="aura-settings-section-top">
              <Icon name="user" size={21} />
              <div>
                <h2>{t("الحساب والجلسة", "Account and session")}</h2>
                <p>{t("اطّلع على حسابك وتحكم في تسجيل الخروج بشكل واضح وآمن", "Review your account and sign out securely")}</p>
              </div>
            </div>
            <div className="aura-settings-account-overview">
              <div>
                <strong>{name.trim() || t("حساب Noäta", "Noäta account")}</strong>
                <span dir="ltr">{email}</span>
              </div>
              <button type="button" className="aura-settings-signout"
                onClick={() => void logoutFromSettings()} disabled={logoutBusy}>
                <Icon name="arrow-start" size={18} />
                {logoutBusy ? t("جارٍ تسجيل الخروج…", "Signing out…") : t("تسجيل الخروج من حسابي", "Sign out of my account")}
              </button>
            </div>
            {logoutError && <p role="alert" className="aura-settings-notice error">{logoutError}</p>}
            <p className="aura-settings-security-foot">
              {t("الضغط على صورتك الشخصية يفتح قائمة الحساب؛ لا يُسجل الخروج تلقائيًا.", "Select your profile picture to open the account menu. This does not sign you out.")}
            </p>
          </section>
        </div>
      ),
    },
  ];

  return (
    <div className="aura-settings-page" data-tour-page="settings">
      {status && <p role="alert">{status}</p>}
      <header className="aura-settings-heading" data-tour="settings-profile">
        <div>
           <span className="eyebrow">{t("إعدادات الحساب · Noäta Aura", "Account settings · Noäta Aura")}</span>
           <h1>{t("مساحتك، بطريقتك.", "Your space, your way.")}</h1>
          <p>
             {t("تحكم في شكل التطبيق، تفضيلات الذكاء الاصطناعي وحماية حسابك من مكان واحد.","Manage appearance, AI preferences, and account security in one place.")}
          </p>
        </div>
        <span className="aura-settings-email" title={email}>
          {email}
        </span>
      </header>
      <div className="aura-settings-tabs-wrap" data-tour="settings-sections">
        <Tabs
          items={settingsTabs}
          activeId={activeTab}
          onChange={handleSelectTab}
          label={t("أقسام الإعدادات", "Settings sections")}
        />
      </div>
    </div>
  );
}
