"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell() {
  const supabase = useMemo(() => createClient(), []);
  const [count, setCount] = useState(0);

  useEffect(() => {
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      setCount(count ?? 0);
    })();
  }, [supabase]);

  return (
    <a
      className="top-icon notification-bell"
      href="/notifications"
      aria-label={"Notifications" + (count ? " (" + count + " unread)" : "")}
    >
      <span>♢</span>
      {count > 0 && <b>{count > 9 ? "9+" : count}</b>}
    </a>
  );
}
