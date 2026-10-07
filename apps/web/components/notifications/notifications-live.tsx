"use client";

import { useEffect, useMemo, useState } from "react";
import { safeHref } from "@/lib/ai/workspace";
import { createClient } from "@/lib/supabase/client";

type Notice = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsLive() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSignedIn(false);
      return;
    }
    setSignedIn(true);
    const { data } = await supabase
      .from("notifications")
      .select("id,type,title,body,href,read_at,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data ?? []) as Notice[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function mark(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      setError("تعذّر حفظ حالة الإشعارات. حاول مرة تانية.");
      return;
    }
    setRows((r) =>
      r.map((x) =>
        x.id === id ? { ...x, read_at: new Date().toISOString() } : x,
      ),
    );
  }

  async function markAll() {
    const unread = rows.filter((x) => !x.read_at).map((x) => x.id);
    if (!unread.length) return;
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unread);
    if (error) {
      setError("تعذّر حفظ حالة الإشعارات. حاول مرة تانية.");
      return;
    }
    setRows((r) =>
      r.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })),
    );
  }

  if (signedIn === false)
    return (
      <section className="panel" style={{ textAlign: "center", padding: 32 }}>
        <h2>سجّل الدخول لعرض إشعاراتك.</h2>
        <a
          className="btn"
          href="/login"
          style={{ background: "var(--accent)", color: "var(--surface)" }}
        >
          دخول
        </a>
      </section>
    );

  return (
    <>
      <header className="topbar" style={{ marginBottom: 18 }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--accent)" }}>
            INBOX
          </div>
          <h1 style={{ margin: "6px 0 0" }}>الإشعارات</h1>
        </div>
        <button
          className="btn"
          onClick={() => void markAll()}
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          Mark all read
        </button>
      </header>
      {error && (
        <div role="alert" className="error-banner">
          {error}
        </div>
      )}
      <div className="filter-bar">
        <button
          className="filter-chip"
          aria-pressed={!unreadOnly}
          onClick={() => setUnreadOnly(false)}
        >
          الكل
        </button>
        <button
          className="filter-chip"
          aria-pressed={unreadOnly}
          onClick={() => setUnreadOnly(true)}
        >
          غير المقروء
        </button>
      </div>
      <section className="panel">
        <div className="quest-list">
          {rows
            .filter((row) => !unreadOnly || !row.read_at)
            .map((row) => (
              <a
                href={safeHref(row.href)}
                onClick={() => void mark(row.id)}
                key={row.id}
                className="quest"
                style={{ opacity: row.read_at ? 0.72 : 1 }}
              >
                <div className="quest-icon">{row.read_at ? "✓" : "•"}</div>
                <div>
                  <h3>{row.title}</h3>
                  <p>{row.body}</p>
                  <small style={{ color: "var(--muted)" }}>
                    {new Date(row.created_at).toLocaleString()}
                  </small>
                </div>
                <span className="pill">{row.type}</span>
              </a>
            ))}
          {!rows.filter((row) => !unreadOnly || !row.read_at).length && (
            <div
              style={{
                padding: 28,
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              كل شيء هادي هنا — مفيش إشعارات جديدة.
            </div>
          )}
        </div>
      </section>
    </>
  );
}
