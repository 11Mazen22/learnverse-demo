"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { DataTable, type DataColumn } from "@/components/ui/table";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { localizedTimestamp } from "@/lib/dashboard/relative-time";
import { downloadCsv } from "@/lib/dashboard/csv-export";

type TermRow = {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  academic_year: string;
  starts_on: string;
  ends_on: string;
  is_active: boolean;
};

type FlagRow = {
  flag_key: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  enabled: boolean;
  rollout_scope: "all" | "staff" | "students" | "beta";
  updated_at: string;
};

type SchoolAnnouncement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
};

/**
 * Admin governance controls for Academic Terms, Feature Flags, School Announcements,
 * and audit-logged compliance exports (Stage 08 M3).
 */
export function SchoolGovernancePanels({ adminId }: { adminId: string | undefined }) {
  const t = useTranslation();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);

  const [terms, setTerms] = useState<TermRow[]>([]);
  const [flags, setFlags] = useState<FlagRow[]>([]);
  const [notices, setNotices] = useState<SchoolAnnouncement[]>([]);
  const [schemaPending, setSchemaPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Academic term composer
  const [termSlug, setTermSlug] = useState("");
  const [termAr, setTermAr] = useState("");
  const [termEn, setTermEn] = useState("");
  const [termYear, setTermYear] = useState("2026-2027");
  const [termStart, setTermStart] = useState("2026-09-01");
  const [termEnd, setTermEnd] = useState("2027-01-20");

  // Feature flag composer
  const [flagKey, setFlagKey] = useState("");
  const [flagAr, setFlagAr] = useState("");
  const [flagEn, setFlagEn] = useState("");
  const [flagScope, setFlagScope] = useState<FlagRow["rollout_scope"]>("all");

  // School announcement composer
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPublishNow, setAnnPublishNow] = useState(true);

  const loadGovernance = useCallback(async () => {
    setSchemaPending(false);
    try {
      const [termsRes, flagsRes, annRes] = await Promise.all([
        supabase
          .from("academic_terms")
          .select("id,slug,title_ar,title_en,academic_year,starts_on,ends_on,is_active")
          .order("starts_on", { ascending: false }),
        supabase
          .from("feature_flags")
          .select("flag_key,title_ar,title_en,description_ar,description_en,enabled,rollout_scope,updated_at")
          .order("flag_key"),
        supabase
          .from("class_announcements")
          .select("id,title,body,pinned,published_at,created_at")
          .is("class_id", null)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      const err = termsRes.error ?? flagsRes.error ?? annRes.error;
      if (err) {
        if (err.code === "42P01" || err.code === "PGRST205") {
          setSchemaPending(true);
          return;
        }
        throw err;
      }
      setTerms((termsRes.data ?? []) as TermRow[]);
      setFlags((flagsRes.data ?? []) as FlagRow[]);
      setNotices((annRes.data ?? []) as SchoolAnnouncement[]);
    } catch {
      setStatusMsg(t("تعذّر تحميل إعدادات التشغيل والفترات.", "Could not load governance configuration."));
    }
  }, [supabase, t]);

  useEffect(() => {
    void loadGovernance();
  }, [loadGovernance]);

  async function createTerm(e: FormEvent) {
    e.preventDefault();
    const cleanSlug = termSlug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!cleanSlug || !termAr.trim() || !termEn.trim() || !termStart || !termEnd) return;
    if (termEnd <= termStart) {
      setStatusMsg(t("يجب أن يكون تاريخ الانتهاء بعد تاريخ البداية.", "End date must be after start date."));
      return;
    }
    setBusy(true);
    setStatusMsg("");
    try {
      const { error } = await supabase.from("academic_terms").insert({
        slug: cleanSlug,
        title_ar: termAr.trim(),
        title_en: termEn.trim(),
        academic_year: termYear.trim() || "2026-2027",
        starts_on: termStart,
        ends_on: termEnd,
        is_active: false,
      });
      if (error) throw error;
      setTermSlug("");
      setTermAr("");
      setTermEn("");
      setStatusMsg(t("تم إضافة الفصل الدراسي ✓", "Academic term added ✓"));
      await loadGovernance();
    } catch {
      setStatusMsg(t("تعذّر حفظ الفصل الدراسي. تأكد من عدم تكرار المعرّف.", "Could not save academic term. Ensure slug is unique."));
    } finally {
      setBusy(false);
    }
  }

  async function activateTerm(term: TermRow) {
    if (term.is_active) return;
    const confirmed = await confirmAction({
      title: t("تفعيل الفصل الدراسي؟", "Set active academic term?"),
      description: locale === "en" ? term.title_en : term.title_ar,
      confirmLabel: t("تفعيل", "Activate"),
      cancelLabel: t("إلغاء", "Cancel"),
    });
    if (!confirmed) return;
    setBusy(true);
    setStatusMsg("");
    try {
      await supabase.from("academic_terms").update({ is_active: false }).eq("is_active", true);
      const { error } = await supabase.from("academic_terms").update({ is_active: true }).eq("id", term.id);
      if (error) throw error;
      setStatusMsg(t("تم تفعيل الفصل الدراسي ✓", "Academic term activated ✓"));
      await loadGovernance();
    } catch {
      setStatusMsg(t("تعذّر تفعيل الفصل الدراسي.", "Could not activate term."));
    } finally {
      setBusy(false);
    }
  }

  async function toggleFlag(flag: FlagRow) {
    setBusy(true);
    setStatusMsg("");
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled: !flag.enabled, updated_by: adminId ?? null })
        .eq("flag_key", flag.flag_key);
      if (error) throw error;
      setStatusMsg(t("تم تحديث الراية ✓", "Feature flag updated ✓"));
      await loadGovernance();
    } catch {
      setStatusMsg(t("تعذّر تحديث راية الميزة.", "Could not update feature flag."));
    } finally {
      setBusy(false);
    }
  }

  async function updateFlagScope(flag: FlagRow, scope: FlagRow["rollout_scope"]) {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("feature_flags")
        .update({ rollout_scope: scope, updated_by: adminId ?? null })
        .eq("flag_key", flag.flag_key);
      if (error) throw error;
      await loadGovernance();
    } catch {
      setStatusMsg(t("تعذّر تغيير نطاق الإطلاق.", "Could not change rollout scope."));
    } finally {
      setBusy(false);
    }
  }

  async function createFlag(e: FormEvent) {
    e.preventDefault();
    const cleanKey = flagKey.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "_");
    if (!/^[a-z][a-z0-9_.-]{1,63}$/.test(cleanKey)) {
      setStatusMsg(t("المفتاح يجب أن يبدأ بحرف إنجليزي صغير.", "Flag key must start with a lowercase ASCII letter."));
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("feature_flags").insert({
        flag_key: cleanKey,
        title_ar: flagAr.trim() || cleanKey,
        title_en: flagEn.trim() || cleanKey,
        rollout_scope: flagScope,
        enabled: false,
        updated_by: adminId ?? null,
      });
      if (error) throw error;
      setFlagKey("");
      setFlagAr("");
      setFlagEn("");
      setStatusMsg(t("تم إنشاء راية الميزة ✓", "Feature flag created ✓"));
      await loadGovernance();
    } catch {
      setStatusMsg(t("تعذّر إنشاء الراية.", "Could not create feature flag."));
    } finally {
      setBusy(false);
    }
  }

  async function createSchoolNotice(e: FormEvent) {
    e.preventDefault();
    if (!adminId || !annTitle.trim() || !annBody.trim()) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("class_announcements").insert({
        class_id: null,
        author_id: adminId,
        title: annTitle.trim().slice(0, 180),
        body: annBody.trim().slice(0, 2000),
        pinned: true,
        published_at: annPublishNow ? new Date().toISOString() : null,
      });
      if (error) throw error;
      setAnnTitle("");
      setAnnBody("");
      setStatusMsg(t("تم حفظ الإعلان العام ✓", "School announcement saved ✓"));
      await loadGovernance();
    } catch {
      setStatusMsg(t("تعذّر حفظ الإعلان العام.", "Could not save school announcement."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteNotice(item: SchoolAnnouncement) {
    const ok = await confirmAction({
      title: t("حذف الإعلان العام؟", "Delete school announcement?"),
      description: item.title,
      confirmLabel: t("حذف", "Delete"),
      cancelLabel: t("إلغاء", "Cancel"),
      tone: "danger",
      icon: "close",
    });
    if (!ok) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("class_announcements").delete().eq("id", item.id);
      if (error) throw error;
      await loadGovernance();
    } finally {
      setBusy(false);
    }
  }

  const termColumns: DataColumn<TermRow>[] = [
    {
      key: "title",
      header: t("الفصل الدراسي", "Academic Term"),
      isRowHeader: true,
      cell: (row) => (
        <div>
          <strong>{locale === "en" ? row.title_en : row.title_ar}</strong>
          <div style={{ fontSize: ".76rem", color: "var(--muted)" }}>{row.academic_year}</div>
        </div>
      ),
    },
    {
      key: "dates",
      header: t("الفترة", "Date range"),
      cell: (row) => `${row.starts_on} → ${row.ends_on}`,
    },
    {
      key: "state",
      header: t("الحالة", "Status"),
      cell: (row) =>
        row.is_active ? (
          <span className="noata-staff-badge" data-tone="success">{t("نشط الآن", "Active")}</span>
        ) : (
          <button type="button" className="btn" disabled={busy} onClick={() => void activateTerm(row)}>
            {t("تعيين كنشط", "Set active")}
          </button>
        ),
    },
  ];

  const flagColumns: DataColumn<FlagRow>[] = [
    {
      key: "flag_key",
      header: t("المعرّف", "Flag key"),
      isRowHeader: true,
      cell: (row) => (
        <div>
          <code>{row.flag_key}</code>
          <div style={{ fontSize: ".76rem", color: "var(--muted)" }}>
            {locale === "en" ? row.title_en : row.title_ar}
          </div>
        </div>
      ),
    },
    {
      key: "scope",
      header: t("النطاق", "Scope"),
      cell: (row) => (
        <select
          aria-label={t("نطاق ", "Rollout scope for ") + row.flag_key}
          className="model-select"
          value={row.rollout_scope}
          disabled={busy}
          onChange={(e) => void updateFlagScope(row, e.target.value as FlagRow["rollout_scope"])}
        >
          <option value="all">{t("الجميع", "All users")}</option>
          <option value="staff">{t("الكادر فقط", "Staff only")}</option>
          <option value="students">{t("الطلاب فقط", "Students only")}</option>
          <option value="beta">{t("تجريبي", "Beta")}</option>
        </select>
      ),
    },
    {
      key: "enabled",
      header: t("التشغيل", "State"),
      cell: (row) => (
        <button
          type="button"
          className="btn"
          aria-pressed={row.enabled}
          disabled={busy}
          onClick={() => void toggleFlag(row)}
        >
          {row.enabled ? t("مفعّل", "Enabled") : t("متوقف", "Disabled")}
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
      {statusMsg && (
        <p role="status" className="aura-staff-status">
          {statusMsg}
        </p>
      )}
      {schemaPending && (
        <p role="status" className="aura-staff-status">
          {t("جداول الفصول والرايات قيد التفعيل على قاعدة البيانات.", "Academic terms and feature flags tables require M3 database migration.")}
        </p>
      )}

      <div className="noata-gov-grid">
        {/* Academic Terms */}
        <section className="panel" data-tour="admin-terms">
          <div className="panel-head">
            <h2>{t("الفصول والتقويم الدراسي", "Academic terms & calendar")}</h2>
            <button
              type="button"
              className="btn"
              disabled={!terms.length}
              onClick={() => {
                const started = downloadCsv(
                  "noata-academic-terms.csv",
                  ["Slug", "Arabic", "English", "Year", "Starts", "Ends", "Active"],
                  terms.map((x) => [x.slug, x.title_ar, x.title_en, x.academic_year, x.starts_on, x.ends_on, x.is_active ? "Yes" : "No"]),
                );
                if (started) {
                  void supabase.rpc("log_staff_export", { p_entity_type: "academic_terms", p_row_count: terms.length }).then(null, () => {});
                }
              }}
            >
              {t("تصدير CSV (مُسجل)", "Logged CSV export")}
            </button>
          </div>
          <form onSubmit={createTerm} style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
              <input className="search" value={termSlug} onChange={(e) => setTermSlug(e.target.value)} placeholder={t("معرّف مثال: fall-2026", "Slug: fall-2026")} aria-label={t("معرّف الفصل", "Term slug")} />
              <input className="search" value={termAr} onChange={(e) => setTermAr(e.target.value)} placeholder={t("الاسم بالعربية", "Title (AR)")} aria-label={t("الاسم بالعربية", "Term Arabic title")} />
              <input className="search" value={termEn} onChange={(e) => setTermEn(e.target.value)} placeholder={t("الاسم بالإنجليزية", "Title (EN)")} aria-label={t("الاسم بالإنجليزية", "Term English title")} />
              <input className="search" value={termYear} onChange={(e) => setTermYear(e.target.value)} placeholder="2026-2027" aria-label={t("العام الدراسي", "Academic year")} />
              <input className="search" type="date" value={termStart} onChange={(e) => setTermStart(e.target.value)} aria-label={t("تاريخ البداية", "Start date")} />
              <input className="search" type="date" value={termEnd} onChange={(e) => setTermEnd(e.target.value)} aria-label={t("تاريخ النهاية", "End date")} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || schemaPending || !termSlug.trim() || !termAr.trim() || !termEn.trim()}>
              {t("إضافة فصل دراسي", "Add academic term")}
            </button>
          </form>
          <DataTable
            caption={t("قائمة الفصول الدراسية", "Academic terms list")}
            columns={termColumns}
            rows={terms}
            getRowKey={(row) => row.id}
            empty={<div className="noata-staff-empty">{t("لم تُنشأ فصول دراسية بعد.", "No academic terms defined yet.")}</div>}
          />
        </section>

        {/* Feature Flags */}
        <section className="panel" data-tour="admin-feature-flags">
          <div className="panel-head">
            <h2>{t("رايات المزايا وإطلاق التحديثات", "Feature flags & rollouts")}</h2>
            <span className="pill">{flags.length}</span>
          </div>
          <form onSubmit={createFlag} style={{ display: "grid", gap: 10, marginBottom: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
              <input className="search" value={flagKey} onChange={(e) => setFlagKey(e.target.value)} placeholder={t("مفتاح مثال: new_study_mode", "Key: new_study_mode")} aria-label={t("مفتاح الميزة", "Flag key")} />
              <input className="search" value={flagAr} onChange={(e) => setFlagAr(e.target.value)} placeholder={t("وصف عربي", "Arabic label")} aria-label={t("وصف الميزة بالعربية", "Flag Arabic title")} />
              <input className="search" value={flagEn} onChange={(e) => setFlagEn(e.target.value)} placeholder={t("وصف إنجليزي", "English label")} aria-label={t("وصف الميزة بالإنجليزية", "Flag English title")} />
              <select className="model-select" value={flagScope} onChange={(e) => setFlagScope(e.target.value as FlagRow["rollout_scope"])} aria-label={t("نطاق الإطلاق", "Rollout scope")}>
                <option value="all">{t("الجميع", "All")}</option>
                <option value="staff">{t("الكادر فقط", "Staff")}</option>
                <option value="students">{t("الطلاب فقط", "Students")}</option>
                <option value="beta">{t("تجريبي", "Beta")}</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || schemaPending || !flagKey.trim()}>
              {t("إضافة راية ميزة", "Create feature flag")}
            </button>
          </form>
          <DataTable
            caption={t("جدول رايات المزايا", "Feature flags list")}
            columns={flagColumns}
            rows={flags}
            getRowKey={(row) => row.flag_key}
            empty={<div className="noata-staff-empty">{t("لا توجد رايات معرفة.", "No feature flags configured.")}</div>}
          />
        </section>
      </div>

      {/* School-wide Announcements */}
      <section className="panel" data-tour="admin-announcements">
        <div className="panel-head">
          <h2>{t("الإعلانات المدرسية العامة", "School-wide announcements")}</h2>
          <span className="pill">{notices.length}</span>
        </div>
        <div className="content-grid">
          <form onSubmit={createSchoolNotice} style={{ display: "grid", gap: 10 }}>
            <input className="search" value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder={t("عنوان الإعلان العام", "Announcement headline")} aria-label={t("عنوان الإعلان العام", "School announcement headline")} />
            <textarea className="search" value={annBody} onChange={(e) => setAnnBody(e.target.value)} placeholder={t("نص الإعلان لجميع الطلاب والمعلمين…", "Announcement text for all learners and staff…")} aria-label={t("نص الإعلان العام", "School announcement body")} />
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{t("نشر فوري للجميع", "Publish immediately")}</span>
              <input type="checkbox" checked={annPublishNow} onChange={(e) => setAnnPublishNow(e.target.checked)} />
            </label>
            <button type="submit" className="btn btn-primary" disabled={busy || schemaPending || !annTitle.trim() || !annBody.trim()}>
              {t("نشر الإعلان العام", "Save announcement")}
            </button>
          </form>
          <div className="quest-list">
            {notices.map((n) => (
              <article className="quest" key={n.id}>
                <div className="quest-icon" aria-hidden="true">★</div>
                <div>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                  <p>{n.published_at ? t("منشور", "Published") : t("مسودة", "Draft")} · {localizedTimestamp(n.created_at, locale === "en" ? "en" : "ar")}</p>
                </div>
                <button type="button" className="btn noata-staff-warning-btn" disabled={busy} onClick={() => void deleteNotice(n)}>
                  {t("حذف", "Delete")}
                </button>
              </article>
            ))}
            {!notices.length && (
              <div className="noata-staff-empty">{t("لا توجد إعلانات عامة حاليًا.", "No school-wide announcements posted yet.")}</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
