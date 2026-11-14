"use client";

import { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Button, IconButton } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { localized, useLocale } from "@/lib/i18n/locale";
import {
  DEFAULT_DASHBOARD_PREFERENCES,
  moveWidgetOrder,
  parseDashboardPreferences,
  toggleWidgetVisibility,
  type DashboardPreferences,
  type DashboardWidgetId,
} from "@/lib/dashboard/preferences";

const WIDGET_LABELS: Record<
  DashboardWidgetId,
  { ar: string; en: string; descAr: string; descEn: string }
> = {
  metrics: {
    ar: "مؤشرات الأداء الأربعة",
    en: "Four Learning Pillars",
    descAr: "الخبرة (XP)، المراجعات المستحقة، نسبة الإتقان، والدروس المكتملة",
    descEn: "Learning XP level, scheduled recall, skill mastery, and completed lessons",
  },
  consistency: {
    ar: "سجل الانتظام وأهداف الأسبوع",
    en: "Consistency Heatmap & Weekly Goals",
    descAr: "خريطة التفاعل لآخر ١٤ يومًا ومتابعة أهداف البطاقات والدروس",
    descEn: "14-day study consistency grid and progress toward weekly targets",
  },
  next_steps: {
    ar: "قائمة خطواتك والمهام الشخصية",
    en: "Next Steps & Personal Tasks",
    descAr: "واجباتك المدرسية القريبة ومهام المذاكرة الشخصية القابلة للإنجاز الفوري",
    descEn: "Upcoming class assignments and inline checkable personal study tasks",
  },
  weak_radar: {
    ar: "رادار المفاهيم الشائكة",
    en: "Concept Clarification Radar",
    descAr: "المفاهيم التي تحتاج تدريبًا إضافيًا مع رابط مباشر للشرح والتمرين",
    descEn: "Skills flagged for reinforcement with direct AI and drill links",
  },
  curriculum: {
    ar: "مسارات المواد الست",
    en: "Core Subjects & Tracks",
    descAr: "تبديل اللغة للمواد ثنائية اللغة وتقدم كل مسار دراسي",
    descEn: "All six core curriculum subjects, bilingual switches, and progress",
  },
  quick_launcher: {
    ar: "قاذفة الأدوات الذكية",
    en: "Quick Action Launcher",
    descAr: "وصول سريع إلى Noäta AI، استوديو البطاقات، المراجعات، والتحديات",
    descEn: "Direct shortcuts to Noäta AI, Study Studio, Recall, Missions, and Boss",
  },
};

export function CustomizeDashboardDrawer({
  open,
  onClose,
  preferences,
  saving,
  signedIn,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  preferences: DashboardPreferences;
  saving: boolean;
  signedIn: boolean;
  onSave: (next: DashboardPreferences) => Promise<void> | void;
}) {
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);
  const [draft, setDraft] = useState<DashboardPreferences>(preferences);

  useEffect(() => {
    if (open) {
      setDraft(parseDashboardPreferences(preferences));
    }
  }, [open, preferences]);

  const updateGoal = (key: keyof DashboardPreferences["goals"], raw: string) => {
    const parsed = Number(raw);
    setDraft((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        [key]: Number.isFinite(parsed) ? parsed : prev.goals[key],
      },
    }));
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="end"
      title={t("تخصيص لوحة التحكم والأهداف", "Customize Dashboard & Weekly Goals")}
      footer={
        <div className="nk-customize-footer">
          <Button
            variant="ghost"
            size="sm"
            iconStart="refresh"
            disabled={saving}
            onClick={() => setDraft(parseDashboardPreferences(DEFAULT_DASHBOARD_PREFERENCES))}
          >
            {t("إعادة الضبط", "Reset defaults")}
          </Button>
          <div className="nk-customize-actions">
            <Button variant="secondary" size="sm" onClick={onClose} disabled={saving}>
              {t("إلغاء", "Cancel")}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              iconStart="check"
              onClick={() => void onSave(parseDashboardPreferences(draft))}
            >
              {t("حفظ التخطيط", "Save layout")}
            </Button>
          </div>
        </div>
      }
    >
      <div className="nk-customize-body">
        <p className="nk-customize-note">
          {signedIn
            ? t(
                "يتم حفظ ترتيب البطاقات وأهدافك الأسبوعية في حسابك لتظهر عبر كل أجهزتك.",
                "Widget layout and weekly goals are saved to your account across devices.",
              )
            : t(
                "أنت في وضع المعاينة؛ ستُحفظ تفضيلاتك محليًا في هذا المتصفح فقط حتى تسجل الدخول.",
                "Preview mode: layout changes persist locally in this browser until you sign in.",
              )}
        </p>

        <section className="nk-customize-section" aria-label={t("الأهداف الأسبوعية", "Weekly Goals")}>
          <h3 className="nk-customize-heading">
            <Icon name="target" size={16} />
            <span>{t("الأهداف الأسبوعية", "Weekly Study Targets")}</span>
          </h3>
          <div className="nk-goals-form">
            <Field
              label={t("هدف البطاقات الأسبوعي (5–500)", "Weekly flashcard reviews (5–500)")}
              hint={t("عدد البطاقات المستهدف مراجعتها أسبوعيًا.", "Target active-recall cards per week.")}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={5}
                  max={500}
                  value={draft.goals.weeklyCardsTarget}
                  onChange={(e) => updateGoal("weeklyCardsTarget", e.target.value)}
                />
              )}
            </Field>

            <Field
              label={t("هدف الدروس الأسبوعي (1–50)", "Weekly lessons completed (1–50)")}
              hint={t("عدد دروس المنهج المستهدفة كل أسبوع.", "Target published lessons per week.")}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={1}
                  max={50}
                  value={draft.goals.weeklyLessonsTarget}
                  onChange={(e) => updateGoal("weeklyLessonsTarget", e.target.value)}
                />
              )}
            </Field>

            <Field
              label={t("هدف التركيز اليومي بالدقائق (10–240)", "Daily focus target in minutes (10–240)")}
            >
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  min={10}
                  max={240}
                  value={draft.goals.dailyMinutesTarget}
                  onChange={(e) => updateGoal("dailyMinutesTarget", e.target.value)}
                />
              )}
            </Field>
          </div>
        </section>

        <section className="nk-customize-section" aria-label={t("ترتيب وإظهار الأقسام", "Widget Order & Visibility")}>
          <h3 className="nk-customize-heading">
            <Icon name="layout" size={16} />
            <span>{t("أقسام اللوحة وترتيبها", "Dashboard Sections & Order")}</span>
          </h3>
          <ul className="nk-widget-list">
            {draft.widgetOrder.map((id, idx) => {
              const meta = WIDGET_LABELS[id];
              const visible = !draft.hiddenWidgets.includes(id);
              return (
                <li key={id} className={`nk-widget-row${visible ? "" : " is-hidden"}`}>
                  <div className="nk-widget-meta">
                    <strong>{t(meta.ar, meta.en)}</strong>
                    <small>{t(meta.descAr, meta.descEn)}</small>
                  </div>
                  <div className="nk-widget-controls">
                    <IconButton
                      icon="chevron-up"
                      size="sm"
                      variant="subtle"
                      label={t(`تحريك ${meta.ar} للأعلى`, `Move ${meta.en} up`)}
                      disabled={idx === 0}
                      onClick={() => setDraft((curr) => moveWidgetOrder(curr, id, "up"))}
                    />
                    <IconButton
                      icon="chevron-down"
                      size="sm"
                      variant="subtle"
                      label={t(`تحريك ${meta.ar} للأسفل`, `Move ${meta.en} down`)}
                      disabled={idx === draft.widgetOrder.length - 1}
                      onClick={() => setDraft((curr) => moveWidgetOrder(curr, id, "down"))}
                    />
                    <Button
                      size="sm"
                      variant={visible ? "secondary" : "subtle"}
                      iconStart={visible ? "eye" : "eye-off"}
                      aria-pressed={visible}
                      onClick={() => setDraft((curr) => toggleWidgetVisibility(curr, id))}
                    >
                      {visible ? t("ظاهر", "Shown") : t("مخفي", "Hidden")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </Drawer>
  );
}
