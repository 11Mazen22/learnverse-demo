"use client";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import type { Conversation } from "@/lib/ai/workspace";
type Props = {
  rows: Conversation[];
  activeId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onOpen: (id: string) => void;
  onNew: () => void;
  onAction: (
    c: Conversation,
    action: "pin" | "archive" | "rename" | "delete",
  ) => void;
  busy: boolean;
  archived: boolean;
  onArchiveView: () => void;
  temporary: boolean;
  onTemporary: () => void;
};
export function ConversationHistory(p: Props) {
  return (
    <aside className="ai-sidebar">
      <Link href="/" className="ai-back">
        <Icon name="arrow" size={16} />
        رجوع إلى الرئيسية
      </Link>
      <div className="brand">
        <div className="brand-mark">
          n<span>·</span>
        </div>
        <div className="brand-copy">
          <strong>noata ai.</strong>
          <span>مساحة للأفكار الكبيرة.</span>
        </div>
      </div>
      <button disabled={p.busy} className="ai-new" onClick={p.onNew}>
        <Icon name="plus" size={17} />
        محادثة جديدة
      </button>
      <input
        className="history-search"
        value={p.query}
        onChange={(e) => p.onQuery(e.target.value)}
        placeholder="ابحث في محادثاتك…"
        aria-label="ابحث في محادثاتك"
      />
      <div className="filter-bar" style={{ margin: 0, gap: 5 }}>
        <button
          className="filter-chip"
          onClick={p.onArchiveView}
          aria-pressed={p.archived}
        >
          {p.archived ? "عرض الأرشيف" : "المحادثات"}
        </button>
        <button
          className="filter-chip"
          disabled={p.busy}
          onClick={p.onTemporary}
          aria-pressed={p.temporary}
        >
          مؤقتة
        </button>
      </div>
      <div className="ai-history">
        {p.rows.map((c) => (
          <div
            className={"history-row " + (c.id === p.activeId ? "active" : "")}
            key={c.id}
          >
            <button
              className="history-title"
              disabled={p.busy}
              onClick={() => p.onOpen(c.id)}
              aria-current={c.id === p.activeId ? "true" : undefined}
            >
              {c.pinned ? "◆ " : ""}
              {c.title}
            </button>
            <div className="history-actions">
              <time dateTime={c.updated_at}>
                {new Date(c.updated_at).toLocaleDateString("ar-EG", {
                  month: "short",
                  day: "numeric",
                })}
              </time>
              {(["pin", "rename", "archive", "delete"] as const).map(
                (action) => (
                  <button
                    key={action}
                    disabled={p.busy}
                    onClick={() => p.onAction(c, action)}
                    aria-label={
                      {
                        pin: c.pinned ? "إلغاء التثبيت" : "تثبيت",
                        rename: "تغيير الاسم",
                        archive: c.archived ? "استعادة المحادثة" : "أرشفة",
                        delete: "حذف",
                      }[action]
                    }
                  >
                    <Icon
                      name={
                        {
                          pin: "pin",
                          rename: "edit",
                          archive: "archive",
                          delete: "trash",
                        }[action]
                      }
                      size={13}
                    />
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
        {!p.rows.length && (
          <div className="empty-state">
            <Icon name="book" />
            <p>
              {p.query ? "مفيش محادثات مطابقة." : "أفكارك الجاية تبدأ بمحادثة."}
            </p>
          </div>
        )}
      </div>
      <Link className="ai-back" href="/settings">
        <Icon name="settings" size={16} />
        تفضيلاتك وخصوصيتك
      </Link>
    </aside>
  );
}
