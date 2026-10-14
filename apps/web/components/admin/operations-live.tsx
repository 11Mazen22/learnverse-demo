"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FANAR_CAPABILITIES } from "@/lib/ai/catalog";
type Audit = {
  id: number;
  action: string;
  entity_type: string;
  created_at: string;
};
export function OperationsLive() {
 const t=useTranslation(),locale=useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [audit, setAudit] = useState<Audit[]>([]),
    [usage, setUsage] = useState<{ capability: string; attempts: number }[]>(
      [],
    ),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const [a, u] = await Promise.all([
          supabase
            .from("audit_events")
            .select("id,action,entity_type,created_at")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase.rpc("admin_ai_usage_summary"),
        ]);
        if (!live) return;
        if (a.error || u.error) setError(t("تعذّر تحميل سجل العمليات.","Could not load the operations log."));
        else {
          setAudit(a.data ?? []);
          setUsage(u.data ?? []);
        }
      } catch {
        if (live) setError(t("تعذّر تحميل سجل العمليات.","Could not load the operations log."));
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [supabase, retry]);
  return (
    <>
      <div className="section-heading">
        <h2>{t("استخدام الذكاء الاصطناعي","AI usage")}</h2>
        <span className="pill">{t("آخر 500 عملية","Latest 500 operations")}</span>
      </div>
      {error && (
        <p role="alert" className="error-banner">
          {error}{" "}
          <button type="button" onClick={() => setRetry((x) => x + 1)}>{t("إعادة المحاولة","Try again")}</button>
        </p>
      )}
      <p style={{ color: "var(--muted)", fontSize: 12 }}>{t("الأرقام تمثّل محاولات الاستخدام المسجّلة، وليست اختبارًا لحالة المزوّد أو ضمانًا لنجاح الرد.","These counts show recorded usage attempts. They do not confirm provider availability or successful responses.")}</p>
      <section className="grid-4">
        {FANAR_CAPABILITIES.map((c) => (
          <article className="metric-card" key={c.id}>
            <span>{c.label}</span>
            <strong>
              {loading || error
                ? "—"
                : (usage.find((x) => x.capability === c.id)?.attempts ?? 0)}
            </strong>
            <small>{c.category}</small>
          </article>
        ))}
      </section>
      <section className="panel" style={{ marginTop: 24 }}>
        <div className="panel-head">
          <h2>{t("سجل النشاط الإداري","Administration activity")}</h2>
          <span className="pill">{t("آخر 50 حدث","Latest 50 events")}</span>
        </div>
        {audit.map((row) => (
          <div className="quest" key={row.id}>
            <div className="quest-icon">✓</div>
            <div>
              <h3>{row.action}</h3>
              <p>{row.entity_type}</p>
            </div>
            <time dateTime={row.created_at}>
              {new Date(row.created_at).toLocaleString(locale==="en"?"en":"ar-EG")}
            </time>
          </div>
        ))}
        {!loading && !audit.length && !error && (
          <p className="empty-state">{t("لا توجد أحداث مسجّلة بعد.","No events have been recorded yet.")}</p>
        )}
      </section>
    </>
  );
}
