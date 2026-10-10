"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import { localized, useLocale } from "@/lib/i18n/locale";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";
export function NotificationBell() {
  const locale = useLocale(), numberLocale = locale === "en" ? "en" : "ar-EG";
  const t = (ar: string, en: string) => localized(locale, ar, en);
  const account = useVerifiedAccount(),
    [count, setCount] = useState<number | null>(null),
    [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let alive = true,
      sequence = 0;
    setCount(null);
    setUnavailable(false);
    async function refresh() {
      if (!account.user) return;
      const token = account.revision.current,
        seq = ++sequence;
      try {
        const result = await boundedRead(
          createClient()
            .from("notifications")
            .select("id", { count: "exact", head: true })
            .eq("user_id", account.user.id)
            .is("read_at", null),
        );
        if (!alive || seq !== sequence || token !== account.revision.current)
          return;
        if (result.error || result.count === null)
          throw result.error ?? Error("Unknown count");
        setCount(result.count);
        setUnavailable(false);
      } catch {
        if (alive && seq === sequence && token === account.revision.current) {
          setCount(null);
          setUnavailable(true);
        }
      }
    }
    const update = () => void refresh();
    void refresh();
    window.addEventListener("noata-notifications-updated", update);
    return () => {
      alive = false;
      ++sequence;
      window.removeEventListener("noata-notifications-updated", update);
    };
  }, [account.user, account.revision]);
  const currentCount = account.user && !account.loading ? count : null;
  return (
    <a
      className="top-icon notification-bell"
      href="/notifications"
      aria-label={
         t("الإشعارات", "Notifications") +
        (unavailable
           ? t(" — تعذّر تحديث عدد غير المقروء", " — unread count unavailable")
          : currentCount !== null
             ? t(` — ${currentCount.toLocaleString(numberLocale)} غير مقروءة`, ` — ${currentCount.toLocaleString(numberLocale)} unread`)
            : "")
      }
    >
      <Icon name="bell" size={20} />
      {currentCount !== null && currentCount > 0 && (
         <b aria-hidden="true">{currentCount > 99 ? t("٩٩+", "99+") : currentCount.toLocaleString(numberLocale)}</b>
      )}
    </a>
  );
}
