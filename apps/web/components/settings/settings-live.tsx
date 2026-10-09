"use client";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConfirmedMutation } from "@/lib/supabase/use-confirmed-mutation";
import { createClient } from "@/lib/supabase/client";
import { ThemeControl } from "@/components/preferences/theme-control";
import { PaletteGallery, syncBrowserThemeColor } from "@/components/preferences/palette-gallery";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { Icon } from "@/components/ui/icon";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { CHAT_MODEL_CARDS } from "@/lib/ai/model-routing";
import {resolveAppearance} from "@/lib/appearance/mode";
import {DesignStudio} from "@/components/preferences/design-studio";

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
type Notice = { kind: "success" | "error"; message: string };
function normalizeSettings(row: Record<string, unknown> | null): Settings {
  const validModel =
    row?.default_ai_model === "auto" ||
    CHAT_MODEL_CARDS.some((m) => m.id === row?.default_ai_model);
  return {
    theme:
      row?.theme === "dark" || row?.theme === "light" ? row.theme : "system",
    locale: row?.locale === "en" ? "en" : "ar",
    reduced_motion: row?.reduced_motion === true,
    default_ai_model: validModel ? String(row?.default_ai_model) : "auto",
    ai_memory_enabled: row?.ai_memory_enabled !== false,
  };
}
function applySettings(settings: Settings) {
  try {
    localStorage.setItem("noata-theme", settings.theme);
    localStorage.setItem("noata-locale", settings.locale);
  } catch {
    /* Account persistence still succeeded. */
  }
  document.documentElement.lang = settings.locale;
  document.documentElement.dir = settings.locale === "ar" ? "rtl" : "ltr";
  document.documentElement.dataset.theme = resolveAppearance(
    settings.theme,document.documentElement.dataset.palette,
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  document.documentElement.dataset.reducedMotion = settings.reduced_motion
    ? "true"
    : "false";
  syncBrowserThemeColor();
}
export function SettingsLive() {
  const supabase = useMemo(() => createClient(), []);
  const { account, run, status, busy: mutating } = useConfirmedMutation();
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<Settings>(DEFAULT);
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

  useEffect(() => {
    if (account.loading) return;
    let active = true;
    setUserId("");
    setEmail("");
    setName("");
    setSettings(DEFAULT);
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
              "theme,locale,reduced_motion,default_ai_model,ai_memory_enabled",
            )
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);
        if (profile.error || preferences.error)
          throw profile.error ?? preferences.error;
        if (!active) return;
        const next = normalizeSettings(
          preferences.data as Record<string, unknown> | null,
        );
        const displayName = profile.data?.display_name ?? "";
        setName(displayName);
        setSettings(next);
        setInitial(JSON.stringify({ name: displayName, settings: next }));
      } catch {
        if (active)
          setError(
            "تعذّر تحميل إعدادات حسابك. حاول مجددًا بعد التحقق من الاتصال.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, reload, account.user, account.loading]);

  const dirty = JSON.stringify({ name, settings }) !== initial;
  useUnsavedWork(Boolean(userId && dirty));
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!userId || saving || mutating) return;
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setNotice({
        kind: "error",
        message: "اسم العرض لازم يكون بين حرفين و٨٠ حرفًا.",
      });
      return;
    }
    setSaving(true);
    setNotice(null);
    const token = account.revision.current;
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
          throw Error("تعذّر تحديث الملف الشخصي. لم تُحفظ كل الإعدادات.");
        const settingResult = await supabase
          .from("user_settings")
          .upsert(
            {
              user_id: userId,
              ...settings,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" },
          )
          .select("user_id")
          .single();
        check();
        if (settingResult.error)
          throw Error(
            "اتحفظ الاسم، لكن تفضيلات الجهاز والذكاء الاصطناعي لم تُحفظ. حاول مرة أخرى.",
          );
        applySettings(settings);
        setName(cleanName);
        setInitial(JSON.stringify({ name: cleanName, settings }));
        setNotice({
          kind: "success",
          message: "تم حفظ إعداداتك في حسابك بنجاح.",
        });
      } catch (err) {
        check();
        setNotice({
          kind: "error",
          message: err instanceof Error ? err.message : "تعذّر حفظ الإعدادات.",
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
        message: "اكتب كلمة مرور مكوّنة من ٨ أحرف على الأقل.",
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
          message: "تم تحديث كلمة المرور. حافظ عليها في مكان آمن.",
        });
      } catch {
        check();
        setSecurityNotice({
          kind: "error",
          message: "تعذّر تحديث كلمة المرور. قد تحتاج لتسجيل الدخول مجددًا.",
        });
      }
    }, "");
    if (token === account.revision.current) setPasswordBusy(false);
  }
  async function logoutFromSettings() {
    if (!userId || logoutBusy || saving || mutating) return;
    const revision = account.revision.current;
    const approved = await confirmAction({
      title: "تسجيل ال��روج من Noata؟",
      description: dirty
        ? "لديك تغييرات غير محفوظة في إعدادات الحساب. سيؤدي تسجيل الخروج إلى فقد هذه التغييرات."
        : "يمكنك العودة في أي وقت وتسجيل الدخول إلى حسابك لاستكمال رحلتك.",
      confirmLabel: "تسجيل الخروج",
      cancelLabel: "البقاء في حسابي",
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
      setLogoutError("لم يكتمل تسجيل الخروج. تحقّق من الاتصال وحاول مرة أخرى.");
      setLogoutBusy(false);
    }
  }
  if (account.error)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>
          إعادة المحاولة
        </button>
      </section>
    );
  if (account.loading || loading)
    return (
      <section className="aura-settings-state" role="status">
        <Icon name="settings" size={29} />
        <h1>بنحمّل إعداداتك…</h1>
        <p>البيانات مرتبطة بحسابك الشخصي.</p>
      </section>
    );
  if (error)
    return (
      <section className="aura-settings-state" role="alert">
        <h1>في مشكلة في تحميل الإعدادات</h1>
        <p>{error}</p>
        <button type="button" onClick={() => setReload((n) => n + 1)}>
          حاول مرة أخرى
        </button>
      </section>
    );
  if (!userId)
    return (
      <>
        <ModuleWelcome
          title="مساحتك، بطريقتك."
          description="احفظ تفضيلات القراءة والذكاء الاصطناعي بين الأجهزة. المظهر متاح الآن على هذا الجهاز؛ بقية التفضيلات تحتاج حسابك."
          eyebrow="صمّم تجربتك"
          icon="settings"
          route="/settings"
          steps={["اختر المظهر المريح", "خصّص تفضيلات المساعد", "احمِ حسابك"]}
        />
        <section className="aura-device-appearance">
          <div>
            <h2>مظهر هذا الجهاز</h2>
            <p>جرّب الوضع النهاري، الليلي أو تلقائيًا حسب جهازك.</p>
          </div>
          <ThemeControl />
        </section>
        <DesignStudio />
      </>
    );

  return (
    <div className="aura-settings-page">
      {status && <p role="alert">{status}</p>}
      <header className="aura-settings-heading">
        <div>
          <span className="eyebrow">إعدادات الحساب · Noata Aura</span>
          <h1>مساحتك، بطريقتك.</h1>
          <p>
            تحكم في شكل التطبيق، تفضيلات الذكاء الاصطناعي وحماية حسابك من مكان
            واحد.
          </p>
        </div>
        <span className="aura-settings-email" title={email}>
          {email}
        </span>
      </header>
      <nav className="aura-settings-nav" aria-label="أقسام الإعدادات">
        <a href="#aura-profile">الملف الشخصي</a>
        <a href="#aura-appearance">المظهر</a>
        <a href="#aura-ai">Noata AI</a>
        <a href="#aura-security">الأمان</a>
        <a href="#aura-account">الحساب والجلسة</a>
      </nav>
      <form className="aura-settings-content" onSubmit={(e) => void save(e)}>
        <section id="aura-profile" className="aura-settings-section">
          <div className="aura-settings-section-top">
            <Icon name="settings" size={21} />
            <div>
              <h2>الملف الشخصي</h2>
              <p>الاسم واللغة الأساسية لحسابك</p>
            </div>
          </div>
          <label className="aura-settings-label">
            <span>اسم العرض</span>
            <input
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك داخل Noata"
            />
          </label>
          <label className="aura-settings-label">
            <span>لغة الواجهة</span>
            <select
              value={settings.locale}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  locale: e.target.value === "en" ? "en" : "ar",
                }))
              }
            >
              <option value="ar">العربية — الواجهة الأساسية</option>
              <option value="en">English — جزئية</option>
            </select>
            <small>بعض الصفحات ما زالت عربية حتى عند اختيار الإنجليزية.</small>
          </label>
        </section>
        <section id="aura-appearance" className="aura-settings-section">
          <div className="aura-settings-section-top">
            <Icon name="sun" size={21} />
            <div>
              <h2>المظهر والحركة</h2>
              <p>اقرأ براحة وخلّي التنقل مناسبًا لك</p>
            </div>
          </div>
          <div
            className="aura-settings-theme-options"
            role="group"
            aria-label="اختر المظهر"
          >
            {(
              [
                { value: "system", label: "تلقائي", icon: "screen" },
                { value: "light", label: "فاتح", icon: "sun" },
                { value: "dark", label: "داكن", icon: "moon" },
              ] as const
            ).map((o) => (
              <button
                type="button"
                key={o.value}
                aria-pressed={settings.theme === o.value}
                onClick={() => setSettings((s) => ({ ...s, theme: o.value }))}
              >
                <Icon name={o.icon} size={20} />
                {o.label}
              </button>
            ))}
          </div>
          <PaletteGallery />
          <DesignStudio />
          <label className="aura-settings-switch">
            <span>
              <strong>تقليل الحركة</strong>
              <small>قلّل التحولات البصرية والرسوم المتحركة.</small>
            </span>
            <input
              type="checkbox"
              checked={settings.reduced_motion}
              onChange={(e) =>
                setSettings((s) => ({ ...s, reduced_motion: e.target.checked }))
              }
            />
          </label>
        </section>
        <section id="aura-ai" className="aura-settings-section">
          <div className="aura-settings-section-top">
            <Icon name="ai" size={21} />
            <div>
              <h2>Noata AI</h2>
              <p>اختار تفضيلا�� الدردشة والنماذج المهيأة</p>
            </div>
          </div>
          <label className="aura-settings-label">
            <span>نموذج الذكاء الاصطناعي الافتراضي</span>
            <select
              value={settings.default_ai_model}
              onChange={(e) =>
                setSettings((s) => ({ ...s, default_ai_model: e.target.value }))
              }
            >
              <option value="auto">تلقائي · توجيه حسب نوع السؤال</option>
              {CHAT_MODEL_CARDS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.arabic} · {o.subtitle}
                </option>
              ))}
            </select>
            <small>
              وجود النموذج في القائمة يعني أنه مهيّأ؛ توفّره الفعلي يعتمد على
              الخدمة.
            </small>
          </label>
          <label className="aura-settings-switch">
            <span>
              <strong>حفظ محادثات الذكاء الاصطناعي</strong>
              <small>
                عند إيقافها تستخدم المحادثات الجديدة الوضع المؤقت. لا تُحذف
                المحادثات القديمة تلقائيًا.
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
        <div className="aura-settings-savebar">
          <div>
            <strong>
              {dirty ? "عندك تغييرات لسه متحفظتش" : "تفضيلاتك الحالية"}
            </strong>
            <small>الحفظ يتأكد من تحديث حسابك قبل ظهور رسالة النجاح.</small>
          </div>
          <button type="submit" disabled={!dirty || saving}>
            {saving ? "جارٍ الحفظ…" : "حفظ التغييرات"}
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
      </form>
      <section
        id="aura-security"
        className="aura-settings-section aura-settings-security"
      >
        <div className="aura-settings-section-top">
          <Icon name="pin" size={21} />
          <div>
            <h2>حماية الحساب</h2>
            <p>تغيير كلمة المرور بشكل مستقل عن بقية التفضيلات</p>
          </div>
        </div>
        <label className="aura-settings-label">
          <span>كلمة مرور جديدة</span>
          <span className="aura-settings-password">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="٨ أحرف على الأقل"
            />
            <button
              type="button"
              onClick={() => setShowPassword((x) => !x)}
              aria-label={
                showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
              }
            >
              {showPassword ? "إخفاء" : "إظهار"}
            </button>
          </span>
        </label>
        <button
          type="button"
          className="aura-settings-password-action"
          disabled={password.length < 8 || passwordBusy}
          onClick={() => void updatePassword()}
        >
          {passwordBusy ? "جارٍ التحديث…" : "تحديث كلمة المرور"}
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
          لا تشارك كلمة المرور مع أي شخص. صلاحيات حسابك تتحكم فيها سياسات قاعدة
          البيانات على الخادم، وليس هذه الصفحة.
        </p>
      </section>
      <section id="aura-account" className="aura-settings-section aura-settings-account">
        <div className="aura-settings-section-top">
          <Icon name="user" size={21} />
          <div>
            <h2>الحساب والجلسة</h2>
            <p>اطّلع على حسابك وتحكم في تسجيل الخروج بشكل واضح وآمن</p>
          </div>
        </div>
        <div className="aura-settings-account-overview">
          <div>
            <strong>{name.trim() || "حساب Noata"}</strong>
            <span dir="ltr">{email}</span>
          </div>
          <button type="button" className="aura-settings-signout"
            onClick={() => void logoutFromSettings()} disabled={logoutBusy}>
            <Icon name="arrow" size={18} />
            {logoutBusy ? "جارٍ تسجيل الخروج…" : "تسجيل الخروج من حسابي"}
          </button>
        </div>
        {logoutError && <p role="alert" className="aura-settings-notice error">{logoutError}</p>}
        <p className="aura-settings-security-foot">
          الضغط على صورتك الشخصية يفتح قائمة الحساب؛ لا يُسجل الخروج تلقائيًا.
        </p>
      </section>
    </div>
  );
}
