"use client";
/*
 * Noata AI workspace sidebar.
 * Interaction structure adapted from Open WebUI v0.6.5 Sidebar under BSD-3-Clause.
 * See docs/THIRD_PARTY_NOTICES.md.
 */
import Link from "next/link";
import { useMemo } from "react";
import { Icon } from "@/components/ui/icon";
import type { Conversation } from "@/lib/ai/workspace";

type Action = "pin" | "archive" | "rename" | "delete";
type Props = {
  rows: Conversation[];
  activeId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onAction: (c: Conversation, action: Action) => void;
  busy: boolean;
  archived: boolean;
  onArchiveView: () => void;
  temporary: boolean;
  onTemporary: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
};

function dateBucket(value: string) {
  const now = new Date();
  const date = new Date(value);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  const delta = start - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (delta < day) return "اليوم";
  if (delta < day * 2) return "أمس";
  if (delta < day * 7) return "آخر 7 أيام";
  if (delta < day * 30) return "آخر 30 يوم";
  return "أقدم";
}

function ConversationItem({
  c,
  p,
}: {
  c: Conversation;
  p: Props;
}) {
  return (
    <div className={"owui-chat-row " + (c.id === p.activeId ? "active" : "")}>
      <button
        className="owui-chat-title"
        disabled={p.busy}
        onClick={() => p.onOpen(c.id)}
        aria-current={c.id === p.activeId ? "page" : undefined}
        title={c.title}
      >
        <Icon name="chat" size={16} />
        <span>{c.title}</span>
      </button>
      <details className="aura-history-menu">
        <summary aria-label={"خيارات محادثة: " + c.title} title="خيارات المحادثة" aria-haspopup="menu">
          <Icon name="dots" size={18} />
        </summary>
        <div className="aura-history-menu-panel" role="group" aria-label={"إدارة "+c.title}>
          {(["pin", "rename", "archive", "delete"] as const).map((action) => {
            const label = {
              pin: c.pinned ? "إلغاء التثبيت" : "تثبيت المحادثة",
              rename: "إعادة تسمية المحادثة",
              archive: c.archived ? "استعادة المحادثة" : "أرشفة المحادثة",
              delete: "حذف المحادثة",
            }[action];
            const icon = {pin:"pin",rename:"edit",archive:"archive",delete:"trash"}[action];
            return (
              <button
                type="button"
                key={action}
                disabled={p.busy}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.closest("details")?.removeAttribute("open");
                  p.onAction(c,action);
                }}
              >
                <Icon name={icon} size={16} /> <span>{label}</span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}

export function ConversationHistory(p: Props) {
  const grouped = useMemo(() => {
    const pinned = p.rows.filter((c) => c.pinned);
    const regular = p.rows.filter((c) => !c.pinned);
    const groups = new Map<string, Conversation[]>();
    for (const c of regular) {
      const key = dateBucket(c.updated_at);
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }
    return { pinned, groups: Array.from(groups.entries()) };
  }, [p.rows]);

  if (p.collapsed) {
    return (
      <aside className="owui-sidebar collapsed" aria-label="Noata AI navigation">
        <div className="owui-rail">
          <button
            type="button"
            className="owui-icon"
            onClick={p.onToggleCollapse}
            aria-label="فتح القائمة الجانبية"
            title="فتح القائمة الجانبية"
          >
            <Icon name="sidebar" />
          </button>
          <button
            type="button"
            className="owui-icon"
            onClick={p.onNew}
            disabled={p.busy}
            aria-label="محادثة جديدة"
            title="محادثة جديدة"
          >
            <Icon name="edit" />
          </button>
          <Link className="owui-icon" href="/" aria-label="لوحة Noata" title="لوحة Noata">
            <Icon name="home" />
          </Link>
          <span className="owui-rail-spacer" />
          <button
            type="button"
            className="owui-icon"
            onClick={p.onOpenSettings}
            aria-label="إعدادات Noata AI"
            title="إعدادات Noata AI"
          >
            <Icon name="settings" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="owui-sidebar" aria-label="Noata AI navigation">
      <div className="owui-sidebar-top">
        <div className="owui-brand">
          <div className="owui-brand-mark" aria-hidden="true">
            n<span>·</span>
          </div>
          <div>
            <strong>noata ai.</strong>
            <small>مساحة أفكارك الذكية</small>
          </div>
        </div>
        <button
          type="button"
          className="owui-icon"
          onClick={p.onToggleCollapse}
          aria-label="طي القائمة الجانبية"
          title="طي القائمة الجانبية"
        >
          <Icon name="sidebar" />
        </button>
      </div>

      <button
        type="button"
        className="owui-new-chat"
        disabled={p.busy}
        onClick={p.onNew}
      >
        <Icon name="edit" size={17} />
        <span>محادثة جديدة</span>
        <kbd>Ctrl ⇧ O</kbd>
      </button>

      <label className="owui-search">
        <Icon name="search" size={16} />
        <input
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder="ابحث في محادثاتك"
          aria-label="ابحث في محادثاتك"
        />
      </label>

      <div className="owui-sidebar-links">
        <Link href="/">
          <Icon name="home" size={16} />
          <span>الرجوع إلى Noata</span>
        </Link>
        <button
          type="button"
          onClick={p.onTemporary}
          disabled={p.busy}
          aria-pressed={p.temporary}
          className={p.temporary ? "active" : ""}
        >
          <Icon name="clock" size={16} />
          <span>محادثة مؤقتة</span>
          {p.temporary && <i>ON</i>}
        </button>
        <button
          type="button"
          onClick={p.onArchiveView}
          aria-pressed={p.archived}
          className={p.archived ? "active" : ""}
        >
          <Icon name="archive" size={16} />
          <span>{p.archived ? "الرجوع للمحادثات" : "الأرشيف"}</span>
        </button>
      </div>

      <div className="owui-history" aria-label={p.archived ? "المحادثات المؤرشفة" : "المحادثات"}>
        {grouped.pinned.length > 0 && (
          <section className="owui-chat-group">
            <h3>مثبّتة</h3>
            {grouped.pinned.map((c) => (
              <ConversationItem key={c.id} c={c} p={p} />
            ))}
          </section>
        )}
        {grouped.groups.map(([label, rows]) => (
          <section className="owui-chat-group" key={label}>
            <h3>{label}</h3>
            {rows.map((c) => (
              <ConversationItem key={c.id} c={c} p={p} />
            ))}
          </section>
        ))}
        {!p.rows.length && (
          <div className="owui-history-empty">
            <Icon name={p.archived ? "archive" : "chat"} size={22} />
            <p>{p.query ? "مفيش محادثات مطابقة." : p.archived ? "الأرشيف فاضي." : "ابدأ محادثة جديدة وخلي أفكارك هنا."}</p>
          </div>
        )}
      </div>

      <div className="owui-sidebar-footer">
        <button type="button" onClick={p.onOpenShortcuts}>
          <Icon name="keyboard" size={16} />
          <span>اختصارات لوحة المفاتيح</span>
        </button>
        <button type="button" onClick={p.onOpenSettings}>
          <Icon name="settings" size={16} />
          <span>الإعدادات والتحكم</span>
        </button>
      </div>
    </aside>
  );
}
