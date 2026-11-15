"use client";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useTranslation } from "@/lib/i18n/locale";

/** Centered launch greeting modeled after a focused AI chat workspace; Sec. 1
 * Term 1 curriculum grounding and Smart Auto routing run automatically behind it. */
export function NoataWelcome({
  signedIn,
  activeSubject = "all",
  activeSubjectLabel,
  onClearSubject,
}: {
  signedIn: boolean | null;
  owner?: string | null;
  onPrompt?: (prompt: string) => void;
  activeSubject?: string;
  activeSubjectLabel?: string;
  onClearSubject?: () => void;
}) {
  const t = useTranslation();

  return (
    <div className="owui-welcome noata-chatgpt-welcome">
      {activeSubject !== "all" && activeSubjectLabel && (
        <button
          type="button"
          className="noata-subject-context-pill"
          onClick={onClearSubject}
          aria-label={t("إزالة تصفية المادة", "Clear subject filter")}
        >
          <span>{activeSubjectLabel}</span>
          <Icon name="close" size={13} />
        </button>
      )}
      <h1>{t("أهلاً بيك! تحب نذاكر أو نعمل إيه النهارده؟", "What can I help with?")}</h1>
      {signedIn === false && (
        <Link className="noata-one-signin" href="/login?next=/ai">
          {t("سجّل الدخول عشان تحفظ محادثاتك وتقدمك", "Sign in to save your chats and progress")}
        </Link>
      )}
    </div>
  );
}
