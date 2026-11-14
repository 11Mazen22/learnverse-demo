"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { DataTable, type DataColumn } from "@/components/ui/table";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { downloadCsv } from "@/lib/dashboard/csv-export";
import { localizedTimestamp } from "@/lib/dashboard/relative-time";

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

type TeacherClassItem = {
  id: string;
  name: string;
  grade_label: string;
  academic_year: string;
};

type MembershipItem = {
  class_id: string;
  student_id: string;
};

type AnnouncementItem = {
  id: string;
  class_id: string | null;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
};

function todayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Class-scoped teacher operations panel for attendance roll call and
 * class announcements (backed by M3 `class_attendance` and `class_announcements`).
 */
export function TeacherOperationsPanel({
  classes,
  memberships,
  profiles,
  teacherId,
}: {
  classes: readonly TeacherClassItem[];
  memberships: readonly MembershipItem[];
  profiles: ReadonlyMap<string, string>;
  teacherId: string | undefined;
}) {
  const t = useTranslation();
  const locale = useLocale();
  const supabase = useMemo(() => createClient(), []);
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [sessionDate, setSessionDate] = useState(todayIsoDate);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annPinned, setAnnPinned] = useState(false);
  const [annPublishNow, setAnnPublishNow] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [schemaPending, setSchemaPending] = useState(false);

  useEffect(() => {
    if (!selectedClassId && classes[0]) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const classRoster = useMemo(() => {
    if (!selectedClassId) return [];
    const seen = new Set<string>();
    return memberships
      .filter((m) => {
        if (m.class_id !== selectedClassId || seen.has(m.student_id)) return false;
        seen.add(m.student_id);
        return true;
      })
      .map((m) => ({
        student_id: m.student_id,
        name: profiles.get(m.student_id) ?? t("طالب", "Student"),
      }));
  }, [memberships, profiles, selectedClassId, t]);

  const loadOperations = useCallback(async () => {
    if (!selectedClassId) return;
    setSchemaPending(false);
    try {
      const [attRes, annRes] = await Promise.all([
        supabase
          .from("class_attendance")
          .select("student_id,status,notes")
          .eq("class_id", selectedClassId)
          .eq("session_date", sessionDate),
        supabase
          .from("class_announcements")
          .select("id,class_id,author_id,title,body,pinned,published_at,created_at")
          .eq("class_id", selectedClassId)
          .order("pinned", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const err = attRes.error ?? annRes.error;
      if (err) {
        if (err.code === "42P01" || err.code === "PGRST205") {
          setSchemaPending(true);
          return;
        }
        throw err;
      }

      const nextMap: Record<string, { status: AttendanceStatus; notes: string }> = {};
      for (const row of (attRes.data ?? []) as { student_id: string; status: string; notes: string }[]) {
        const status = (["present", "late", "absent", "excused"].includes(row.status)
          ? row.status
          : "present") as AttendanceStatus;
        nextMap[row.student_id] = { status, notes: row.notes ?? "" };
      }
      setAttendanceMap(nextMap);
      setAnnouncements((annRes.data ?? []) as AnnouncementItem[]);
    } catch {
      setNotice(t("تعذّر تحميل سجل الحضور والإعلانات.", "Could not load attendance and class announcements."));
    }
  }, [selectedClassId, sessionDate, supabase, t]);

  useEffect(() => {
    void loadOperations();
  }, [loadOperations]);

  function getEntry(studentId: string): { status: AttendanceStatus; notes: string } {
    return attendanceMap[studentId] ?? { status: "present", notes: "" };
  }

  async function saveAttendance() {
    if (!selectedClassId || !classRoster.length || !teacherId) return;
    setBusy(true);
    setNotice("");
    try {
      const payload = classRoster.map((student) => {
        const entry = getEntry(student.student_id);
        return {
          class_id: selectedClassId,
          student_id: student.student_id,
          session_date: sessionDate,
          status: entry.status,
          notes: entry.notes.trim().slice(0, 500),
          recorded_by: teacherId,
        };
      });
      const { error } = await supabase
        .from("class_attendance")
        .upsert(payload, { onConflict: "class_id,student_id,session_date" });
      if (error) throw error;
      setNotice(t("تم حفظ سجل الحضور اليومي ✓", "Daily attendance saved ✓"));
      await loadOperations();
    } catch {
      setNotice(t("تعذّر حفظ الحضور. تحقق من صلاحيات الصف.", "Could not save attendance. Verify class permissions."));
    } finally {
      setBusy(false);
    }
  }

  async function createAnnouncement(e: FormEvent) {
    e.preventDefault();
    if (!selectedClassId || !teacherId || !annTitle.trim() || !annBody.trim()) return;
    setBusy(true);
    setNotice("");
    try {
      const { error } = await supabase.from("class_announcements").insert({
        class_id: selectedClassId,
        author_id: teacherId,
        title: annTitle.trim().slice(0, 180),
        body: annBody.trim().slice(0, 2000),
        pinned: annPinned,
        published_at: annPublishNow ? new Date().toISOString() : null,
      });
      if (error) throw error;
      setAnnTitle("");
      setAnnBody("");
      setAnnPinned(false);
      setNotice(annPublishNow ? t("تم نشر إعلان الصف ✓", "Class announcement published ✓") : t("تم حفظ المسودة ✓", "Draft saved ✓"));
      await loadOperations();
    } catch {
      setNotice(t("تعذّر حفظ إعلان الصف.", "Could not save class announcement."));
    } finally {
      setBusy(false);
    }
  }

  async function togglePublishAnnouncement(item: AnnouncementItem) {
    setBusy(true);
    setNotice("");
    try {
      const nextPublished = item.published_at ? null : new Date().toISOString();
      const { error } = await supabase
        .from("class_announcements")
        .update({ published_at: nextPublished })
        .eq("id", item.id);
      if (error) throw error;
      await loadOperations();
    } catch {
      setNotice(t("تعذّر تحديث حالة الإعلان.", "Could not update announcement state."));
    } finally {
      setBusy(false);
    }
  }

  async function deleteAnnouncement(item: AnnouncementItem) {
    const ok = await confirmAction({
      title: t("حذف الإعلان؟", "Delete announcement?"),
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
      setNotice(t("تم حذف الإعلان ✓", "Announcement deleted ✓"));
      await loadOperations();
    } catch {
      setNotice(t("تعذّر حذف الإعلان.", "Could not delete announcement."));
    } finally {
      setBusy(false);
    }
  }

  const statusLabels: Record<AttendanceStatus, string> = {
    present: t("حاضر", "Present"),
    late: t("متأخر", "Late"),
    absent: t("غائب", "Absent"),
    excused: t("بعذر", "Excused"),
  };

  const attendanceColumns: DataColumn<{ student_id: string; name: string }>[] = [
    {
      key: "name",
      header: t("الطالب", "Student"),
      isRowHeader: true,
      cell: (row) => <strong>{row.name}</strong>,
    },
    {
      key: "status",
      header: t("الحالة", "Attendance"),
      cell: (row) => {
        const current = getEntry(row.student_id).status;
        return (
          <div className="noata-attendance-pills" role="group" aria-label={t("حالة حضور ", "Attendance for ") + row.name}>
            {(["present", "late", "absent", "excused"] as const).map((st) => (
              <button
                key={st}
                type="button"
                className="filter-chip"
                data-status={st}
                aria-pressed={current === st}
                onClick={() =>
                  setAttendanceMap((prev) => ({
                    ...prev,
                    [row.student_id]: { ...getEntry(row.student_id), status: st },
                  }))
                }
              >
                {statusLabels[st]}
              </button>
            ))}
          </div>
        );
      },
    },
    {
      key: "notes",
      header: t("ملاحظات", "Notes"),
      cell: (row) => (
        <input
          type="text"
          className="search"
          aria-label={t("ملاحظة حضور ", "Attendance note for ") + row.name}
          value={getEntry(row.student_id).notes}
          onChange={(e) =>
            setAttendanceMap((prev) => ({
              ...prev,
              [row.student_id]: { ...getEntry(row.student_id), notes: e.target.value },
            }))
          }
          placeholder={t("ملاحظة اختيارية…", "Optional note…")}
        />
      ),
    },
  ];

  const attendanceSummary = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0, excused: 0 };
    for (const s of classRoster) {
      counts[getEntry(s.student_id).status] += 1;
    }
    return counts;
  }, [classRoster, attendanceMap]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {notice && (
        <p role="status" className="aura-staff-status">
          {notice}
        </p>
      )}
      {schemaPending && (
        <p role="status" className="aura-staff-status">
          {t("جداول الحضور والإعلانات قيد التفعيل على قاعدة البيانات الحالية.", "Attendance and announcements tables are pending M3 database migration in this environment.")}
        </p>
      )}

      <section className="panel" data-tour="teacher-attendance">
        <div className="panel-head">
          <div>
            <h2>{t("الحضور اليومي للصفّ", "Class attendance tracker")}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: ".85rem" }}>
              {t("حاضر", "Present")}: {attendanceSummary.present} · {t("متأخر", "Late")}: {attendanceSummary.late} · {t("غائب", "Absent")}: {attendanceSummary.absent} · {t("بعذر", "Excused")}: {attendanceSummary.excused}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button
              type="button"
              className="btn"
              disabled={!classRoster.length}
              onClick={() => {
                const className = classes.find((c) => c.id === selectedClassId)?.name ?? "";
                const started = downloadCsv(
                  `noata-attendance-${sessionDate}.csv`,
                  [t("الصف", "Class"), t("التاريخ", "Date"), t("الطالب", "Student"), t("الحالة", "Status"), t("ملاحظات", "Notes")],
                  classRoster.map((student) => {
                    const entry = getEntry(student.student_id);
                    return [className, sessionDate, student.name, statusLabels[entry.status], entry.notes];
                  }),
                );
                if (started) {
                  void supabase.rpc("log_staff_export", { p_entity_type: "attendance", p_row_count: classRoster.length }).then(null, () => {});
                } else {
                  setNotice(t("تعذّر بدء تنزيل الملف.", "Could not start the file download."));
                }
              }}
            >
              {t("تصدير CSV", "Export CSV")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy || !classRoster.length || schemaPending}
              onClick={() => void saveAttendance()}
            >
              <Icon name="check" size={16} />
              {t("حفظ الحضور", "Save attendance")}
            </button>
          </div>
        </div>

        <div className="noata-staff-list-tools">
          <label className="noata-staff-search">
            <span>{t("الصفّ الدراسي", "Class")}</span>
            <select
              className="model-select"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.grade_label}
                </option>
              ))}
            </select>
          </label>
          <label className="noata-staff-search">
            <span>{t("تاريخ الحصة", "Session date")}</span>
            <input
              type="date"
              className="search"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </label>
        </div>

        <DataTable
          caption={t("سجل حضور الطلاب", "Student attendance roll")}
          columns={attendanceColumns}
          rows={classRoster}
          getRowKey={(row) => row.student_id}
          empty={
            <div className="noata-staff-empty">
              {t("لا يوجد طلاب مسجّلون في هذا الصف بعد.", "No students enrolled in this class yet.")}
            </div>
          }
        />
      </section>

      <section className="content-grid">
        <form className="panel" onSubmit={createAnnouncement}>
          <div className="panel-head">
            <h2>{t("إعلانات الصفّ", "Class announcements")}</h2>
            <span className="pill">{t("موجّه للصف المحدد", "Scoped to selected class")}</span>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <label>
              <small>{t("عنوان الإعلان", "Announcement title")}</small>
              <input
                className="search"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder={t("مثال: موعد اختبار الوحدة الثانية", "Example: Unit 2 Quiz Schedule")}
              />
            </label>
            <label>
              <small>{t("نص الإعلان", "Message")}</small>
              <textarea
                className="search"
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder={t("اكتب تعليمات واضحة للطلاب…", "Write clear instructions for your students…")}
              />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{t("تثبيت أعلى الصفّ", "Pin to top of class feed")}</span>
              <input type="checkbox" checked={annPinned} onChange={(e) => setAnnPinned(e.target.checked)} />
            </label>
            <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{t("نشر للطلاب الآن", "Publish to class students now")}</span>
              <input type="checkbox" checked={annPublishNow} onChange={(e) => setAnnPublishNow(e.target.checked)} />
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={busy || schemaPending || !selectedClassId || !annTitle.trim() || !annBody.trim()}
            >
              {annPublishNow ? t("نشر الإعلان", "Publish announcement") : t("حفظ كمسودة", "Save draft")}
            </button>
          </div>
        </form>

        <aside className="panel">
          <div className="panel-head">
            <h2>{t("الإعلانات المنشورة والمسودات", "Posted & draft notices")}</h2>
            <span className="pill">{announcements.length}</span>
          </div>
          <div className="quest-list">
            {announcements.map((item) => (
              <article className="quest" key={item.id}>
                <div className="quest-icon" aria-hidden="true">{item.pinned ? "★" : "✎"}</div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                  <p>
                    <span className="noata-staff-badge" data-tone={item.published_at ? "success" : "warning"}>
                      {item.published_at ? t("منشور", "Published") : t("مسودة", "Draft")}
                    </span>{" "}
                    · {localizedTimestamp(item.created_at, locale === "en" ? "en" : "ar")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={() => void togglePublishAnnouncement(item)}
                  >
                    {item.published_at ? t("إلغاء النشر", "Unpublish") : t("نشر", "Publish")}
                  </button>
                  <button
                    type="button"
                    className="btn noata-staff-warning-btn"
                    disabled={busy}
                    onClick={() => void deleteAnnouncement(item)}
                  >
                    {t("حذف", "Delete")}
                  </button>
                </div>
              </article>
            ))}
            {!announcements.length && (
              <div className="noata-staff-empty">
                {t("لا توجد إعلانات لهذا الصف بعد.", "No announcements posted for this class yet.")}
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
