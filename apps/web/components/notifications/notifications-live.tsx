"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { safeHref } from "@/lib/ai/workspace";
import { createClient } from "@/lib/supabase/client";
import {
  boundedRead,
  useVerifiedAccount,
} from "@/lib/supabase/use-verified-account";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { Icon } from "@/components/ui/icon";

type Notice = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};
const types: Record<string, string> = {
  assignment: "واجب",
  assignment_published: "واجب جديد",
  assignment_graded: "تقييم",
  grade: "تقييم",
  reward: "مكافأة",
  system: "من المنصة",
};
export function NotificationsLive() {
  const supabase = useMemo(() => createClient(), []),
    router = useRouter(),
    account = useVerifiedAccount();
  const [rows, setRows] = useState<Notice[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false),
    [busy, setBusy] = useState(false);
  const sequence = useRef(0),
    lock = useRef(false);
  const load = useCallback(async () => {
    const seq = ++sequence.current,
      token = account.revision.current;
    if (!account.user) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await boundedRead(
        supabase
          .from("notifications")
          .select("id,type,title,body,href,read_at,created_at")
          .eq("user_id", account.user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      );
      if (seq !== sequence.current || token !== account.revision.current)
        return;
      if (result.error) throw result.error;
      setRows((result.data ?? []) as Notice[]);
    } catch {
      if (seq === sequence.current && token === account.revision.current)
        setError("تعذّر تحميل الإشعارات. أعد المحاولة عند عودة الاتصال.");
    } finally {
      if (seq === sequence.current && token === account.revision.current)
        setLoading(false);
    }
  }, [supabase, account.user, account.revision]);
  useEffect(() => {
    setRows([]);
    void load();
    return () => {
      ++sequence.current;
    };
  }, [load]);
  async function mark(ids: string[]) {
    if (lock.current || !account.user) return false;
    if (!ids.length) return true;
    lock.current = true;
    setBusy(true);
    setError("");
    const token = account.revision.current;
    try {
      const result = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("user_id", account.user.id)
        .in("id", ids)
        .select("id,read_at");
      if (token !== account.revision.current) return false;
      if (result.error || result.data?.length !== ids.length)
        throw result.error ?? Error("Read state was not confirmed");
      const confirmed = new Map(result.data.map((r) => [r.id, r.read_at]));
      setRows((previous) =>
        previous.map((r) =>
          confirmed.has(r.id) ? { ...r, read_at: confirmed.get(r.id)! } : r,
        ),
      );
      window.dispatchEvent(new Event("noata-notifications-updated"));
      return true;
    } catch {
      if (token === account.revision.current)
        setError(
          "لم يتأكد حفظ حالة الإشعارات. حدّث القائمة قبل إعادة المحاولة.",
        );
      return false;
    } finally {
      lock.current = false;
      if (token === account.revision.current) setBusy(false);
    }
  }
  const unread = rows.filter((r) => !r.read_at),
    shown = unreadOnly ? unread : rows;
  if (account.loading || loading)
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>بنجهّز صندوق إشعاراتك…</h2>
      </section>
    );
  if (account.error)
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>
          إعادة المحاولة
        </button>
      </section>
    );
  if (!account.user)
    return (
      <ModuleWelcome
        title="كل جديد، في مكان واحد."
        description="تابع واجباتك وتقييماتك وإشعارات حسابك. يمكنك اختيار غير المقروء والعودة إلى الخطوة المطلوبة."
        icon="bell"
        route="/notifications"
        eyebrow="صندوقك الشخصي"
        steps={[
          "تابع جديد صفّك",
          "افتح الخطوة المطلوبة",
          "احتفظ بالإشعارات للرجوع إليها",
        ]}
      />
    );
  return (
    <div className="aura-inbox">
      <header className="topbar">
        <div>
          <p className="eyebrow">صندوقك الشخصي</p>
          <h1>الإشعارات</h1>
          <p>
            {error
              ? "تعذّر تحديث الصندوق"
              : `${unread.length.toLocaleString("ar-EG")} إشعارات غير مقروءة في أحدث ١٠٠ إشعار`}
          </p>
        </div>
        <button
          className="btn"
          disabled={busy || !unread.length}
          onClick={() => void mark(unread.map((r) => r.id))}
        >
          تحديد الكل كمقروء
        </button>
      </header>
      {error && (
        <div role="alert" className="error-banner">
          {error}{" "}
          <button type="button" disabled={busy} onClick={() => void load()}>
            تحديث القائمة
          </button>
        </div>
      )}
      <div className="filter-bar" role="group" aria-label="تصفية الإشعارات">
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
      <section className="panel" aria-label="قائمة الإشعارات" aria-busy={busy}>
        <div className="aura-inbox-list">
          {shown.map((row) => (
            <article
              key={row.id}
              className="aura-inbox-item"
              data-read={Boolean(row.read_at)}
            >
              <span className="aura-inbox-marker" aria-hidden="true">
                <Icon name={row.read_at ? "check" : "bell"} size={20} />
              </span>
              <div>
                <span className="pill">
                  {types[row.type] ?? "إشعار"} ·{" "}
                  {row.read_at ? "مقروء" : "جديد"}
                </span>
                <h2>{row.title}</h2>
                <p>{row.body}</p>
                <time dateTime={row.created_at}>
                  {new Date(row.created_at).toLocaleString("ar-EG")}
                </time>
                <a
                  href={safeHref(row.href)}
                  onClick={(event) => {
                    if (
                      event.ctrlKey ||
                      event.metaKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    void (async () => {
                      if (row.read_at || (await mark([row.id])))
                        router.push(safeHref(row.href));
                    })();
                  }}
                >
                  فتح الإشعار
                </a>
              </div>
              {!row.read_at && (
                <button
                  type="button"
                  className="icon-btn"
                  disabled={busy}
                  aria-label={"تحديد إشعار " + row.title + " كمقروء"}
                  onClick={() => void mark([row.id])}
                >
                  <Icon name="check" size={18} />
                </button>
              )}
            </article>
          ))}
        </div>
        {!shown.length && !error && (
          <div className="aura-inbox-empty">
            <Icon name="bell" size={32} />
            <h2>{unreadOnly ? "قرأت كل جديد" : "صندوقك جاهز"}</h2>
            <p>
              {unreadOnly
                ? "يمكنك الرجوع إلى جميع الإشعارات من تبويب الكل."
                : "تظهر إشعارات الواجبات والتقييمات هنا عند وصولها."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
