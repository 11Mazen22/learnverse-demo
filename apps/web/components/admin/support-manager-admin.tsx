"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import type { SupportCategory, SupportTicketRecord } from "@/lib/support/types";

export function SupportManagerAdmin() {
  const t = useTranslation();
  const locale = useLocale();
  const isRtl = locale === "ar";
  const supabase = useMemo(() => createClient(), []);

  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Edit status / notes
  const [editingStatus, setEditingStatus] = useState<SupportTicketRecord["status"]>("open");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  const loadTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: err } = await (supabase.from as any)("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) {
        throw new Error(err.message);
      }

      setTickets((data || []) as SupportTicketRecord[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (categoryFilter !== "all" && ticket.category !== categoryFilter) return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        ticket.ticket_code.toLowerCase().includes(q) ||
        ticket.email.toLowerCase().includes(q) ||
        ticket.name.toLowerCase().includes(q) ||
        ticket.subject.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter, categoryFilter]);

  const selectTicketForInspection = (tkt: SupportTicketRecord) => {
    setSelectedTicket(tkt);
    setEditingStatus(tkt.status);
    setAdminNotes(tkt.admin_notes || "");
    setSaveStatus("");
  };

  const handleUpdateTicket = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    setSaveStatus("");
    try {
      const { error: err } = await (supabase.from as any)("support_tickets")
        .update({
          status: editingStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedTicket.id);

      if (err) throw new Error(err.message);

      setSaveStatus(t("تم تحديث حالة التذكرة والملاحظات بنجاح ✓", "Ticket updated successfully ✓"));
      // Update local ticket state
      setTickets((prev) =>
        prev.map((item) =>
          item.id === selectedTicket.id
            ? { ...item, status: editingStatus, admin_notes: adminNotes }
            : item,
        ),
      );
      setSelectedTicket((prev) =>
        prev ? { ...prev, status: editingStatus, admin_notes: adminNotes } : null,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus(t(`تعذر التحديث: ${msg}`, `Update failed: ${msg}`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel" style={{ marginTop: 18, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>
            {t("إدارة تذاكر الدعم الفني", "Support Ticket Operations")}
          </h2>
          <small style={{ color: "var(--muted)" }}>
            {t("الوجهة المعتمدة لإشعارات البريد: mazenshazly011@gmail.com", "Configured email destination: mazenshazly011@gmail.com")}
          </small>
        </div>
        <button
          type="button"
          onClick={loadTickets}
          className="btn"
          style={{ fontSize: "0.85rem", padding: "6px 12px" }}
        >
          {t("تحديث القائمة ⟳", "Refresh ⟳")}
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("بحث بالكود أو البريد أو الموضوع...", "Search code, email or subject...")}
          className="input"
          style={{ flex: "1 1 240px", minWidth: 200 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input"
          style={{ width: "auto" }}
        >
          <option value="all">{t("كل الحالات", "All Statuses")}</option>
          <option value="open">{t("مفتوح (Open)", "Open")}</option>
          <option value="in_progress">{t("قيد المتابعة (In Progress)", "In Progress")}</option>
          <option value="resolved">{t("محلول (Resolved)", "Resolved")}</option>
          <option value="closed">{t("مغلق (Closed)", "Closed")}</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input"
          style={{ width: "auto" }}
        >
          <option value="all">{t("كل التصنيفات", "All Categories")}</option>
          <option value="curriculum">{t("المنهج والمواد", "Curriculum")}</option>
          <option value="tracks">{t("المسارات اللغوية", "Tracks")}</option>
          <option value="lessons">{t("الدروس والأسئلة", "Lessons")}</option>
          <option value="ai">{t("المساعد الذكي", "AI Companion")}</option>
          <option value="account">{t("الحساب والبيانات", "Account")}</option>
          <option value="bug">{t("أخطاء تقنية", "Bugs")}</option>
          <option value="general">{t("عام", "General")}</option>
        </select>
      </div>

      {loading && <p style={{ color: "var(--muted)", padding: 20, textAlign: "center" }}>{t("جارٍ تحميل التذاكر...", "Loading tickets...")}</p>}

      {error && (
        <div style={{ padding: 12, background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 8, color: "var(--danger)", fontSize: "0.85rem", marginBottom: 14 }}>
          {t("تنبيه: تعذر قراءة جدول support_tickets (ربما لم تُطبق الهجرة بعد في بيئة قاعدة البيانات الحالية).", "Notice: support_tickets table is not yet reachable in the current database environment.")}
          <div style={{ fontSize: "0.8rem", marginTop: 4, opacity: 0.85 }}>{error}</div>
        </div>
      )}

      {/* Main Grid: Ticket List + Ticket Inspector */}
      <div style={{ display: "grid", gridTemplateColumns: selectedTicket ? "1fr 1.2fr" : "1fr", gap: 16 }}>
        {/* List */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--line)", textAlign: isRtl ? "right" : "left" }}>
                <th style={{ padding: "8px 10px" }}>{t("الكود", "Code")}</th>
                <th style={{ padding: "8px 10px" }}>{t("المرسل", "Sender")}</th>
                <th style={{ padding: "8px 10px" }}>{t("الموضوع", "Subject")}</th>
                <th style={{ padding: "8px 10px" }}>{t("التصنيف", "Category")}</th>
                <th style={{ padding: "8px 10px" }}>{t("الحالة", "Status")}</th>
                <th style={{ padding: "8px 10px" }}>{t("البريد", "Email")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((tkt) => {
                const isSelected = selectedTicket?.id === tkt.id;
                return (
                  <tr
                    key={tkt.id}
                    onClick={() => selectTicketForInspection(tkt)}
                    style={{
                      borderBottom: "1px solid var(--line)",
                      cursor: "pointer",
                      background: isSelected ? "var(--surface-soft)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "10px", fontWeight: 700, fontFamily: "monospace", color: "var(--accent)" }}>
                      #{tkt.ticket_code}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <div style={{ fontWeight: 600 }}>{tkt.name}</div>
                      <small style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{tkt.email}</small>
                    </td>
                    <td style={{ padding: "10px", maxWidth: 200, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {tkt.subject}
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ fontSize: "0.75rem", padding: "2px 6px", borderRadius: 4, background: "var(--surface-soft)" }}>
                        {tkt.category}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          padding: "2px 6px",
                          borderRadius: 4,
                          fontWeight: 700,
                          background: tkt.status === "open" ? "rgba(59,130,246,0.15)" : tkt.status === "resolved" ? "rgba(16,185,129,0.15)" : "var(--surface-soft)",
                          color: tkt.status === "open" ? "#3b82f6" : tkt.status === "resolved" ? "#10b981" : "var(--ink)",
                        }}
                      >
                        {tkt.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 5px",
                          borderRadius: 4,
                          background: tkt.email_delivery_status === "sent" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)",
                          color: tkt.email_delivery_status === "sent" ? "#10b981" : "#f59e0b",
                        }}
                      >
                        {tkt.email_delivery_status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {filteredTickets.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                    {t("لا توجد تذاكر دعم مسجلة تطابق التصفية الحالية.", "No support tickets match the current filters.")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Inspection Drawer */}
        {selectedTicket && (
          <div
            style={{
              padding: 18,
              borderRadius: 12,
              border: "1px solid var(--line)",
              background: "var(--surface)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                {t("تفاصيل التذكرة", "Ticket Inspection")} #{selectedTicket.ticket_code}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "1rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "0.85rem", lineHeight: 1.6, marginBottom: 16 }}>
              <div><strong>{t("المرسل:", "Sender:")}</strong> {selectedTicket.name} ({selectedTicket.email})</div>
              <div><strong>{t("الموضوع:", "Subject:")}</strong> {selectedTicket.subject}</div>
              <div><strong>{t("التصنيف:", "Category:")}</strong> {selectedTicket.category}</div>
              <div><strong>{t("التاريخ:", "Created At:")}</strong> {new Date(selectedTicket.created_at).toLocaleString()}</div>
              <div>
                <strong>{t("إشعار البريد الإلكتروني:", "Email Delivery:")}</strong>{" "}
                <span style={{ fontWeight: 600, color: selectedTicket.email_delivery_status === "sent" ? "#10b981" : "#f59e0b" }}>
                  {selectedTicket.email_delivery_status} → {selectedTicket.email_destination}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 4 }}>
                {t("نص رسالة المستخدم:", "User Message:")}
              </label>
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: "var(--surface-soft)",
                  border: "1px solid var(--line)",
                  fontSize: "0.85rem",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {selectedTicket.message}
              </div>
            </div>

            {/* Action Bar: Status & Admin Notes */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div style={{ marginBottom: 10 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 4 }}>
                  {t("تحديث حالة التذكرة:", "Update Status:")}
                </label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value as SupportTicketRecord["status"])}
                  className="input"
                  style={{ width: "100%" }}
                >
                  <option value="open">{t("مفتوح (Open)", "Open")}</option>
                  <option value="in_progress">{t("قيد المتابعة (In Progress)", "In Progress")}</option>
                  <option value="resolved">{t("تم الحل (Resolved)", "Resolved")}</option>
                  <option value="closed">{t("مغلق (Closed)", "Closed")}</option>
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: 4 }}>
                  {t("ملاحظات إدارية داخلية (خاصة بفريق العمل):", "Internal Admin Notes (Staff only):")}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t("اكتب ملخص الإجراء المتخذ أو ملاحظات للمشرفين...", "Action taken, supervisor notes...")}
                  className="input"
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              {saveStatus && (
                <div style={{ fontSize: "0.8rem", marginBottom: 10, color: saveStatus.includes("✓") ? "var(--success)" : "var(--danger)" }}>
                  {saveStatus}
                </div>
              )}

              <button
                type="button"
                onClick={handleUpdateTicket}
                disabled={saving}
                className="btn btn-primary"
                style={{ width: "100%", padding: "10px" }}
              >
                {saving ? t("جارٍ الحفظ...", "Saving...") : t("حفظ التعديلات على التذكرة", "Save Ticket Changes")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
