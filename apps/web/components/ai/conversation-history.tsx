"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
/*
 * Noata AI workspace sidebar.
 * Interaction structure adapted from Open WebUI v0.6.5 Sidebar under BSD-3-Clause.
 * See docs/THIRD_PARTY_NOTICES.md.
 */
import {NoataLogo} from "@/components/ui/noata-logo";
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
  onOpenLibrary?: () => void;
  onOpenShortcuts?: () => void;
};

function dateBucket(value: string, t: (ar:string,en:string)=>string) {
  const now = new Date();
  const date = new Date(value);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = 86_400_000;
  const delta = start - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (delta < day) return t("اليوم","Today");
  if (delta < day * 2) return t("أمس","Yesterday");
  if (delta < day * 7) return t("آخر 7 أيام","Previous 7 days");
  if (delta < day * 30) return t("آخر 30 يوم","Previous 30 days");
  return t("أقدم","Older");
}

function ConversationItem({
  c,
  p,
}: {
  c: Conversation;
  p: Props;
}) {
 const t=useTranslation(),locale=useLocale();
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
        <summary aria-label={t("خيارات محادثة: ","Conversation options: ") + c.title} title={t("خيارات المحادثة","Conversation options")} aria-haspopup="menu">
          <Icon name="dots" size={18} />
        </summary>
        <div className="aura-history-menu-panel" role="group" aria-label={t("إدارة ","Manage ")+c.title}>
          {(["pin", "rename", "archive", "delete"] as const).map((action) => {
            const label = {
              pin: c.pinned ? t("إلغاء التثبيت","Unpin") : t("تثبيت المحادثة","Pin conversation"),
              rename: t("إعادة تسمية المحادثة","Rename conversation"),
              archive: c.archived ? t("استعادة المحادثة","Restore conversation") : t("أرشفة المحادثة","Archive conversation"),
              delete: t("حذف المحادثة","Delete conversation"),
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
 const t=useTranslation(),locale=useLocale();
  const grouped = useMemo(() => {
    const pinned = p.rows.filter((c) => c.pinned);
    const regular = p.rows.filter((c) => !c.pinned);
    const groups = new Map<string, Conversation[]>();
    for (const c of regular) {
      const key = dateBucket(c.updated_at,t);
      groups.set(key, [...(groups.get(key) ?? []), c]);
    }
    return { pinned, groups: Array.from(groups.entries()) };
  }, [p.rows,t]);

  if (p.collapsed) {
    return (
      <aside className="owui-sidebar collapsed" aria-label={t("التنقل في Noata AI","Noata AI navigation")}>
        <div className="owui-rail">
          <button
            type="button"
            className="owui-icon owui-rail-toggle"
            onClick={p.onToggleCollapse}
            aria-label={t("فتح القائمة الجانبية","Open sidebar")}
            data-tooltip={t("فتح القائمة الجانبية","Open sidebar")}
          >
            <Icon name="sidebar" />
          </button>
          <span className="owui-rail-divider" aria-hidden="true" />
          <button
            type="button"
            className="owui-icon owui-rail-primary"
            onClick={p.onNew}
            disabled={p.busy}
            aria-label={t("محادثة جديدة","New conversation")}
            data-tooltip={t("محادثة جديدة","New conversation")}
          >
            <Icon name="edit" />
          </button>
          <Link className="owui-icon" href="/" aria-label={t("لوحة Noata","Noata dashboard")} data-tooltip={t("لوحة Noata","Noata dashboard")}>
            <Icon name="home" />
          </Link>
          {p.onOpenLibrary && (
            <button type="button" className="owui-icon" onClick={p.onOpenLibrary} aria-label={t("المشروعات والملفات","Projects and files")} data-tooltip={t("المشروعات والملفات","Projects and files")}>
              <Icon name="archive" />
            </button>
          )}
          <span className="owui-rail-spacer" />
          <button
            type="button"
            className="owui-icon"
            onClick={p.onOpenSettings}
            aria-label={t("إعدادات Noata AI","Noata AI settings")}
            data-tooltip={t("إعدادات Noata AI","Noata AI settings")}
          >
            <Icon name="settings" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="owui-sidebar" aria-label={t("التنقل في Noata AI","Noata AI navigation")}>
      <div className="owui-sidebar-top">
        <div className="owui-brand">
          <NoataLogo size={44}/>
          <div>
            <strong>Noata AI</strong>
            <small>{t("مساحتك لكل فكرة","Your space for every idea")}</small>
          </div>
        </div>
        <button
          type="button"
          className="owui-icon"
          onClick={p.onToggleCollapse}
          aria-label={t("طي القائمة الجانبية","Collapse sidebar")}
          title={t("طي القائمة الجانبية","Collapse sidebar")}
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
        <span>{t("محادثة جديدة","New conversation")}</span>
        <kbd>Ctrl ⇧ O</kbd>
      </button>

      <label className="owui-search">
        <Icon name="search" size={16} />
        <input
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder={t("ابحث في محادثاتك","Search conversations")}
          aria-label={t("ابحث في محادثاتك","Search conversations")}
        />
      </label>

      <div className="owui-section-label">{t("مساحة العمل","Workspace")}</div>
      <div className="owui-sidebar-links">
        <Link href="/" className="aura-home-return">
          <Icon name="home" size={16} />
          <span><strong>{t("مساحة التعلّم","Learning space")}</strong><small>{t("العودة إلى الرئيسية","Back to home")}</small></span>
        </Link>
        {p.onOpenLibrary&&<button type="button" onClick={p.onOpenLibrary}><Icon name="archive" size={16}/><span>{t("المشروعات والملفات","Projects and files")}</span></button>}
        <button
          type="button"
          onClick={p.onTemporary}
          disabled={p.busy}
          aria-pressed={p.temporary}
          className={p.temporary ? "active" : ""}
        >
          <Icon name="clock" size={16} />
          <span>{t("محادثة مؤقتة","Temporary conversation")}</span>
          {p.temporary && <i>ON</i>}
        </button>
        <button
          type="button"
          onClick={p.onArchiveView}
          aria-pressed={p.archived}
          className={p.archived ? "active" : ""}
        >
          <Icon name="archive" size={16} />
          <span>{p.archived ? t("الرجوع للمحادثات","Back to conversations") : t("الأرشيف","Archive")}</span>
        </button>
      </div>

      <div className="owui-section-label owui-history-label">{p.archived ? t("الأرشيف","Archive") : t("المحادثات","Conversations")}</div>
      <div className="owui-history" role="region" aria-label={p.archived ? t("المحادثات المؤرشفة","Archived conversations") : t("المحادثات","Conversations")}>
        {grouped.pinned.length > 0 && (
          <section className="owui-chat-group">
            <h3>{t("مثبّتة","Pinned")}</h3>
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
            <p>{p.query ? t("مفيش محادثات مطابقة.","No matching conversations.") : p.archived ? t("الأرشيف فاضي.","Your archive is empty.") : t("ابدأ محادثة جديدة وخلي أفكارك هنا.","Start a conversation and keep your ideas here.")}</p>
          </div>
        )}
      </div>

      <div className="owui-sidebar-footer">
        <button type="button" onClick={p.onOpenShortcuts}>
          <Icon name="keyboard" size={16} />
          <span>{t("اختصارات لوحة المفاتيح","Keyboard shortcuts")}</span>
        </button>
        <button type="button" onClick={p.onOpenSettings}>
          <Icon name="settings" size={16} />
          <span>{t("الإعدادات والتحكم","Settings and controls")}</span>
        </button>
      </div>
    </aside>
  );
}
