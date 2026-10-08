"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { createClient } from "@/lib/supabase/client";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";
export function NotificationBell() {
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
        "الإشعارات" +
        (unavailable
          ? " — تعذّر تحديث عدد غير المقروء"
          : currentCount !== null
            ? ` — ${currentCount.toLocaleString("ar-EG")} غير مقروءة`
            : "")
      }
    >
      <Icon name="bell" size={20} />
      {currentCount !== null && currentCount > 0 && (
        <b>{currentCount > 9 ? "9+" : currentCount}</b>
      )}
    </a>
  );
}
