"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";

type Theme = "light" | "dark" | "system";
const choices: {
  value: Theme;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "light",
    label: "نهاري",
    description: "إضاءة مريحة وواضحة",
    icon: "sun",
  },
  {
    value: "dark",
    label: "ليلي",
    description: "ألوان هادئة ومساحة أغمق",
    icon: "moon",
  },
  {
    value: "system",
    label: "تلقائي",
    description: "اتبع مظهر جهازك",
    icon: "screen",
  },
];
function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}
function apply(theme: Theme) {
  document.documentElement.dataset.theme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
}
export function ThemeControl() {
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
      setNotice("تعذّر حفظ المظهر على هذا الجهاز.");
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
  }, [supabase, account.user]);
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
      setNotice("المظهر مفعّل لهذه الجلسة فقط؛ تعذّر حفظه على الجهاز.");
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
      if (error) setNotice("تم حفظ المظهر على هذا الجهاز فقط.");
    } catch {
      if (seq !== choiceSequence.current || token !== account.revision.current)
        return;
      setNotice("تم حفظ المظهر على هذا الجهاز فقط.");
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
        aria-label={"تغيير المظهر: " + activeChoice.label}
        aria-haspopup="true"
        aria-expanded={open}
        title={"المظهر: " + activeChoice.label}
      >
        <Icon name={activeChoice.icon} size={19} />
      </button>
      {open && (
        <div
          className="aura-theme-menu"
          role="group"
          aria-label="اختيار المظهر"
        >
          <strong>المظهر</strong>
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
                <b>{choice.label}</b>
                <small>{choice.description}</small>
              </span>
              {theme === choice.value && <Icon name="check" size={15} />}
            </button>
          ))}
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
