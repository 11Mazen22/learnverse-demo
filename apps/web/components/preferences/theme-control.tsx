"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { resolveAppearance } from "@/lib/appearance/mode";
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
    description: "إضاءة مريحة وواضحة",
    descriptionEn: "Clear, comfortable light",
    icon: "sun",
  },
  {
    value: "dark",
    label: "ليلي",
    labelEn: "Dark",
    description: "ألوان هادئة ومساحة أغمق",
    descriptionEn: "Calm colors and a darker space",
    icon: "moon",
  },
  {
    value: "system",
    label: "تلقائي",
    labelEn: "System",
    description: "اتبع مظهر جهازك",
    descriptionEn: "Follow your device's appearance",
    icon: "screen",
  },
];
function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}
function apply(theme: Theme) {
  document.documentElement.dataset.theme = resolveAppearance(theme, document.documentElement.dataset.palette, window.matchMedia("(prefers-color-scheme: dark)").matches);
  syncBrowserThemeColor();
}
export function ThemeControl() {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const choiceSequence = useRef(0);
  const themeWrite = useRef<Promise<unknown>>(Promise.resolve());
  const [theme, setTheme] = useState<Theme>("system");
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
        localStorage.setItem("noata-theme", data.theme);
        apply(data.theme);
      } catch {
        // Device preference stays functional offline.
      }
    })();
    return () => {
      active = false;
      media.removeEventListener("change", osChanged);
      document.removeEventListener("pointerdown", outside);
    };
   }, [supabase, account.user, t]);
  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
      ?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const buttons = Array.from(
          menu.current?.querySelectorAll<HTMLButtonElement>(
            ".aura-theme-menu button",
          ) ?? [],
        );
        if (!buttons.includes(document.activeElement as HTMLButtonElement))
          return;
        event.preventDefault();
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        buttons[
          (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) %
            buttons.length
        ]?.focus();
      }
    };
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [open]);

  async function choose(next: Theme) {
    const seq = ++choiceSequence.current,
      token = account.revision.current;
    setTheme(next);
    setOpen(false);
    trigger.current?.focus();
    setNotice("");
    try {
      localStorage.setItem("noata-theme", next);
    } catch {
       setNotice(t("المظهر مفعّل لهذه الجلسة فقط؛ تعذّر حفظه على الجهاز.", "Appearance is active for this session only; it could not be saved on this device."));
    }
    apply(next);
    try {
      const user = account.user;
      if (!user) return;
      const save = themeWrite.current
        .catch(() => {})
        .then(async () => {
          if (
            seq !== choiceSequence.current ||
            token !== account.revision.current
          )
            return { error: null };
          return supabase
            .from("user_settings")
            .upsert(
              { user_id: user.id, theme: next },
              { onConflict: "user_id" },
            )
            .select("user_id")
            .single();
        });
      themeWrite.current = save;
      const { error } = await save;
      if (seq !== choiceSequence.current || token !== account.revision.current)
        return;
       if (error) setNotice(t("تم حفظ المظهر على هذا الجهاز فقط.", "Appearance was saved on this device only."));
    } catch {
      if (seq !== choiceSequence.current || token !== account.revision.current)
        return;
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
          role="group"
           aria-label={t("اختيار المظهر", "Choose appearance")}
        >
           <strong>{t("المظهر", "Appearance")}</strong>
           <p className="noata-theme-guidance">{t("اختار إضاءة واجهتك ثم عالم الألوان. منتصف الليل يظل داكنًا دائمًا.", "Choose light or dark mode, then a color palette. Midnight always remains dark.")}</p>
          {choices.map((choice) => (
            <button
              type="button"
              key={choice.value}
              onClick={() => void choose(choice.value)}
              aria-pressed={theme === choice.value}
              className={theme === choice.value ? "selected" : ""}
            >
              <Icon name={choice.icon} size={18} />
              <span>
                 <b>{t(choice.label, choice.labelEn)}</b>
                 <small>{t(choice.description, choice.descriptionEn)}</small>
              </span>
              {theme === choice.value && <Icon name="check" size={15} />}
            </button>
          ))}
          <PaletteGallery compact />
           <a className="noata-theme-studio-link" href="/settings#noata-ai-design-studio" onClick={()=>setOpen(false)}><Icon name="sparkles" size={17}/> {t("ابتكر تصميمك مع Noata AI", "Create your design with Noata AI")} <Icon name="arrow" size={15}/></a>
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
