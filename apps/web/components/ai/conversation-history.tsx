"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
/*
 * Noata AI workspace sidebar.
 * Interaction structure adapted from Open WebUI v0.6.5 Sidebar under BSD-3-Clause.
 * See docs/THIRD_PARTY_NOTICES.md.
 */
import {NoataLogo} from "@/components/ui/noata-logo";
import Link from "next/link";
import { useMemo, useRef } from "react";
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
  loading?:boolean;hasMore?:boolean;failed?:boolean;onLoadMore?:()=>void;onRetry?:()=>void;
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
        <span dir="auto">{c.title}</span>
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
 const t=useTranslation(),locale=useLocale(),searchField=useRef<HTMLInputElement>(null);
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
      <aside className="owui-sidebar collapsed noata-compact-rail" aria-label={t("التنقل في Noata AI","Noata AI navigation")}>
        <div className="owui-rail">
          <button type="button" className="owui-icon owui-rail-toggle" onClick={p.onToggleCollapse}
            aria-label={t("توسيع القائمة","Expand sidebar")} data-tooltip={t("توسيع القائمة","Expand sidebar")}>
            <Icon name="sidebar" />
          </button>
          <span className="owui-rail-divider" aria-hidden="true"/>
          <button type="button" className="owui-icon owui-rail-primary" onClick={p.onNew} disabled={p.busy}
            aria-label={t("محادثة جديدة","New chat")} data-tooltip={t("محادثة جديدة","New chat")}>
            <Icon name="edit"/>
          </button>
          <button type="button" className="owui-icon" onClick={p.onToggleCollapse}
            aria-label={t("فتح البحث في المحادثات","Open conversation search")} data-tooltip={t("فتح البحث في المحادثات","Open conversation search")}>
            <Icon name="search"/>
          </button>
          <Link href="/" className="owui-icon" aria-label={t("مساحة التعلّم","Learning space")} data-tooltip={t("مساحة التعلّم","Learning space")}><Icon name="home"/></Link>
          {p.onOpenLibrary && <button type="button" className="owui-icon" onClick={p.onOpenLibrary}
            aria-label={t("المشروعات والملفات","Projects and files")} data-tooltip={t("المشروعات والملفات","Projects and files")}><Icon name="folder"/></button>}
          <span className="owui-rail-spacer"/>
          <button type="button" className="owui-icon" onClick={p.onOpenSettings}
            aria-label={t("الإعدادات","Settings")} data-tooltip={t("الإعدادات","Settings")}><Icon name="settings"/></button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="owui-sidebar noata-organized-sidebar" aria-label={t("التنقل في Noata AI","Noata AI navigation")}>
      <div className="owui-sidebar-top">
        <div className="owui-brand">
          <NoataLogo size={38}/>
          <div>
            <strong>Noata AI</strong>
            <small>{t("فكّر، تعلّم، واصنع","Think · Learn · Create")}</small>
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
      </button>

      <label className="owui-search noata-sidebar-search">
        <Icon name="search" size={16} />
        <input ref={searchField} type="search"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder={t("ابحث باسم المحادثة","Find a chat by name")}
          aria-label={t("ابحث في محادثاتك","Search conversations")}
        />
      </label>


      <nav className="noata-quick-nav" aria-label={t("مساحة العمل","Workspace")}>
        <span className="noata-sidebar-caption">{t("مساحة العمل","WORKSPACE")}</span>
        <div className="noata-quick-grid">
          <Link href="/" className="noata-quick-link">
            <Icon name="home" size={17}/>
            <span>{t("مساحة التعلّم","Learning space")}</span>
          </Link>
          {p.onOpenLibrary && <button type="button" className="noata-quick-link" onClick={p.onOpenLibrary}>
            <Icon name="folder" size={17}/>
            <span>{t("المشروعات والملفات","Projects & files")}</span>
          </button>}
        </div>
        <button type="button" className={"noata-temporary-toggle"+(p.temporary?" active":"")}
          disabled={p.busy} aria-pressed={p.temporary} onClick={p.onTemporary}>
          <Icon name="clock" size={16}/>
          <span>{t("محادثة مؤقتة","Temporary chat")}</span>
          <span className="noata-temporary-switch" aria-hidden="true"><i/></span>
        </button>
      </nav>

      <div className="noata-history-heading"><h2>{p.query.trim()?t("نتائج البحث","Search results"):p.archived?t("الأرشيف","Archived chats"):t("محادثاتك","Your chats")}</h2><button type="button" className="owui-icon" onClick={p.onArchiveView} aria-pressed={p.archived} aria-label={p.archived?t("الرجوع للمحادثات","Back to conversations"):t("الأرشيف","Archive")} title={p.archived?t("الرجوع للمحادثات","Back to conversations"):t("الأرشيف","Archive")}><Icon name={p.archived?"chat":"archive"} size={16}/></button></div>
      <div className={"owui-history noata-chat-index "+(!p.rows.length?"noata-chat-index-empty":"")} role="region" aria-label={p.archived ? t("المحادثات المؤرشفة","Archived conversations") : t("المحادثات","Conversations")}>
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
        {!p.rows.length && !p.loading && !p.failed && (
          <div className="owui-history-empty">
            <Icon name={p.archived ? "archive" : "chat"} size={22} />
            <strong>{p.query?t("لم نجد محادثة بهذا الاسم","No chats found"):p.archived?t("أرشيفك فاضي","Nothing archived yet"):t("أفكارك تبدأ هنا","A place for your ideas")}</strong>
            <p>{p.query?t("جرّب اسمًا أقصر أو امسح البحث.","Try a shorter name or clear your search."):p.archived?t("المحادثات التي تؤرشفها ستظهر هنا.","Chats you archive will appear here."):t("ابدأ محادثة؛ سنحتفظ بها هنا لتكملها في أي وقت.","Start a chat and return to it whenever you want.")}</p>
            <button type="button" disabled={p.busy} onClick={()=>{if(p.query){p.onQuery("");searchField.current?.focus();}else if(p.archived)p.onArchiveView();else p.onNew();}}>{p.query?t("مسح البحث","Clear search"):p.archived?t("الرجوع للمحادثات","Back to conversations"):t("ابدأ محادثة","Start a chat")}</button>
          </div>
        )}
        {p.loading&&<p className="noata-history-status" role="status">{t("جارٍ ترتيب محادثاتك…","Loading your chats…")}</p>}
        {p.failed&&<div className="noata-history-retry" role="status"><p>{t("تعذّر فتح المحادثات. جرّب مرة أخرى.","Could not load chats. Try again.")}</p><button type="button" onClick={p.onRetry}>{t("إعادة المحاولة","Retry")}</button></div>}
        {p.hasMore&&!p.failed&&<button className="noata-history-more" type="button" disabled={p.loading||p.busy} onClick={p.onLoadMore}>{t("محادثات أقدم","Load older chats")}<Icon name="chevron" size={14}/></button>}
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
