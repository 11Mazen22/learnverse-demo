"use client";

import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
import { applyLocale, localized, useLocale } from "@/lib/i18n/locale";

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
  "Fanar-Sadiq-2": "Islamic explanations",
  "Fanar-Oryx-IVU-2": "Image understanding",
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
  } catch {
    /* Account persistence still succeeded. */
  }
  applyLocale(settings.locale);
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
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
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
             t("تعذّر تحميل إعدادات حسابك. حاول مجددًا بعد التحقق من الاتصال.","Could not load your account settings. Check your connection and try again."),
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [supabase, reload, account.user, account.loading, t]);

  const dirty = JSON.stringify({ name, settings }) !== initial;
  useUnsavedWork(Boolean(userId && dirty));
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!userId || saving || mutating) return;
    const cleanName = name.trim();
    if (cleanName.length < 2 || cleanName.length > 80) {
      setNotice({
        kind: "error",
         message: t("اسم العرض لازم يكون بين حرفين و٨٠ حرفًا.","Your display name must be between 2 and 80 characters."),
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
           throw Error(t("تعذّر تحديث الملف الشخصي. لم تُحفظ كل الإعدادات.","Could not update your profile. Some settings were not saved."));
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
             t("اتحفظ الاسم، لكن تفضيلات الجهاز والذكاء الاصطناعي لم تُحفظ. حاول مرة أخرى.","Your name was saved, but your device and AI preferences were not. Please try again."),
          );
        applySettings(settings);
        setName(cleanName);
        setInitial(JSON.stringify({ name: cleanName, settings }));
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
         <h1>{t("بنحمّل إعداداتك…", "Loading your settings…")}</h1>
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
      <>
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
      </>
    );

  return (
    <div className="aura-settings-page">
      {status && <p role="alert">{status}</p>}
      <header className="aura-settings-heading">
        <div>
           <span className="eyebrow">{t("إعدادات الحساب · Noata Aura", "Account settings · Noata Aura")}</span>
           <h1>{t("مساحتك، بطريقتك.", "Your space, your way.")}</h1>
          <p>
             {t("تحكم في شكل التطبيق، تفضيلات الذكاء الاصطناعي وحماية حسابك من مكان واحد.","Manage appearance, AI preferences, and account security in one place.")}
          </p>
        </div>
        <span className="aura-settings-email" title={email}>
          {email}
        </span>
      </header>
       <nav className="aura-settings-nav" aria-label={t("أقسام الإعدادات","Settings sections")}>
         <a href="#aura-profile">{t("الملف الشخصي","Profile")}</a>
         <a href="#aura-appearance">{t("المظهر","Appearance")}</a>
        <a href="#aura-ai">Noata AI</a>
         <a href="#aura-security">{t("الأمان","Security")}</a>
         <a href="#aura-account">{t("الحساب والجلسة","Account and session")}</a>
      </nav>
      <form className="aura-settings-content" onSubmit={(e) => void save(e)}>
        <section id="aura-profile" className="aura-settings-section">
          <div className="aura-settings-section-top">
            <Icon name="settings" size={21} />
            <div>
               <h2>{t("الملف الشخصي","Profile")}</h2>
               <p>{t("الاسم واللغة الأساسية لحسابك","Your name and interface language")}</p>
            </div>
          </div>
          <label className="aura-settings-label">
             <span>{t("اسم العرض","Display name")}</span>
            <input
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
               placeholder={t("اسمك داخل Noata","Your name in Noata")}
            />
          </label>
          <label className="aura-settings-label">
             <span>{t("لغة الواجهة","Interface language")}</span>
            <select
              value={settings.locale}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  locale: e.target.value === "en" ? "en" : "ar",
                }))
              }
            >
               <option value="ar">{t("العربية — الواجهة الأساسية","Arabic")}</option>
               <option value="en">{t("English — جزئية","English — partial")}</option>
            </select>
             <small>{t("بعض الصفحات ما زالت عربية حتى عند اختيار الإنجليزية.","Some pages still appear in Arabic when English is selected.")}</small>
          </label>
        </section>
        <section id="aura-appearance" className="aura-settings-section">
          <div className="aura-settings-section-top">
            <Icon name="sun" size={21} />
            <div>
               <h2>{t("المظهر والحركة","Appearance and motion")}</h2>
               <p>{t("اقرأ براحة وخلّي التنقل مناسبًا لك","Read comfortably and move through Noata your way")}</p>
            </div>
          </div>
          <div
            className="aura-settings-theme-options"
            role="group"
             aria-label={t("اختر المظهر","Choose appearance")}
          >
            {(
              [
                 { value: "system", label: t("تلقائي","System"), icon: "screen" },
                 { value: "light", label: t("فاتح","Light"), icon: "sun" },
                 { value: "dark", label: t("داكن","Dark"), icon: "moon" },
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
           <p className="noata-appearance-footnote">{t("الوضعان فاتح وداكن منفصلان عن عالم الألوان؛ تصميم «منتصف الليل» داكن دائمًا للحفاظ على طابعه.","Light and dark modes are separate from color palettes. The Midnight palette always remains dark.")}</p>
          <label className="aura-settings-switch">
            <span>
               <strong>{t("تقليل الحركة","Reduce motion")}</strong>
               <small>{t("قلّل التحولات البصرية والرسوم المتحركة.","Limit transitions and animations.")}</small>
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
               <p>{t("اختر تفضيلات الدردشة والنماذج المهيأة","Choose chat and model preferences")}</p>
            </div>
          </div>
          <label className="aura-settings-label">
             <span>{t("نموذج الذكاء الاصطناعي الافتراضي","Default AI model")}</span>
            <select
              value={settings.default_ai_model}
              onChange={(e) =>
                setSettings((s) => ({ ...s, default_ai_model: e.target.value }))
              }
            >
               <option value="auto">{t("تلقائي · توجيه حسب نوع السؤال","Auto · selected by question type")}</option>
              {CHAT_MODEL_CARDS.map((o) => (
                <option key={o.id} value={o.id}>
                   {locale === "en" ? o.id : o.arabic} · {locale === "en" ? MODEL_SUBTITLE_EN[o.id] : o.subtitle}
                </option>
              ))}
            </select>
            <small>
               {t("وجود النموذج في القائمة يعني أنه مهيّأ؛ توفّره الفعلي يعتمد على الخدمة.","Listed models are configured; actual availability depends on the provider.")}
            </small>
          </label>
          <label className="aura-settings-switch">
            <span>
               <strong>{t("حفظ محادثات الذكاء الاصطناعي","Save AI conversations")}</strong>
              <small>
                 {t("عند إيقافها تستخدم المحادثات الجديدة الوضع المؤقت. لا تُحذف المحادثات القديمة تلقائيًا.","When off, new chats use temporary mode. Existing conversations are not deleted automatically.")}
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
               {dirty ? t("عندك تغييرات لسه متحفظتش","You have unsaved changes") : t("تفضيلاتك الحالية","Your current preferences")}
            </strong>
             <small>{t("الحفظ يتأكد من تحديث حسابك قبل ظهور رسالة النجاح.","A success message appears only after your account confirms the update.")}</small>
          </div>
          <button type="submit" disabled={!dirty || saving}>
             {saving ? t("جارٍ الحفظ…","Saving…") : t("حفظ التغييرات","Save changes")}
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
      <DesignStudio />
      <section
        id="aura-security"
        className="aura-settings-section aura-settings-security"
      >
        <div className="aura-settings-section-top">
          <Icon name="pin" size={21} />
          <div>
             <h2>{t("حماية الحساب","Account security")}</h2>
             <p>{t("تغيير كلمة المرور بشكل مستقل عن بقية التفضيلات","Change your password separately from other settings")}</p>
          </div>
        </div>
        <label className="aura-settings-label">
           <span>{t("كلمة مرور جديدة","New password")}</span>
          <span className="aura-settings-password">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
               placeholder={t("٨ أحرف على الأقل","At least 8 characters")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((x) => !x)}
              aria-label={
                 showPassword ? t("إخفاء كلمة المرور","Hide password") : t("إظهار كلمة المرور","Show password")
              }
            >
               {showPassword ? t("إخفاء","Hide") : t("إظهار","Show")}
            </button>
          </span>
        </label>
        <button
          type="button"
          className="aura-settings-password-action"
          disabled={password.length < 8 || passwordBusy}
          onClick={() => void updatePassword()}
        >
           {passwordBusy ? t("جارٍ التحديث…","Updating…") : t("تحديث كلمة المرور","Update password")}
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
           {t("لا تشارك كلمة المرور مع أي شخص. صلاحيات حسابك تتحكم فيها سياسات قاعدة البيانات على الخادم، وليس هذه الصفحة.","Never share your password. Server-side database policies control account permissions.")}
        </p>
      </section>
      <section id="aura-account" className="aura-settings-section aura-settings-account">
        <div className="aura-settings-section-top">
          <Icon name="user" size={21} />
          <div>
             <h2>{t("الحساب والجلسة","Account and session")}</h2>
             <p>{t("اطّلع على حسابك وتحكم في تسجيل الخروج بشكل واضح وآمن","Review your account and sign out securely")}</p>
          </div>
        </div>
        <div className="aura-settings-account-overview">
          <div>
             <strong>{name.trim() || t("حساب Noata","Noata account")}</strong>
            <span dir="ltr">{email}</span>
          </div>
          <button type="button" className="aura-settings-signout"
            onClick={() => void logoutFromSettings()} disabled={logoutBusy}>
            <Icon name="arrow" size={18} />
             {logoutBusy ? t("جارٍ تسجيل الخروج…","Signing out…") : t("تسجيل الخروج من حسابي","Sign out of my account")}
          </button>
        </div>
        {logoutError && <p role="alert" className="aura-settings-notice error">{logoutError}</p>}
        <p className="aura-settings-security-foot">
           {t("الضغط على صورتك الشخصية يفتح قائمة الحساب؛ لا يُسجل الخروج تلقائيًا.","Select your profile picture to open the account menu. This does not sign you out.")}
        </p>
      </section>
    </div>
  );
}
