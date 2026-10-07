"use client";
import Link from "next/link";
import { FANAR_CAPABILITIES } from "@/lib/ai/catalog";
import { TOOLS } from "@/lib/ai/workspace";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { ThemeControl } from "@/components/preferences/theme-control";
import { ConversationHistory } from "./conversation-history";
import { RichMessage } from "./rich-message";
import { useAIWorkspace } from "./use-ai-workspace";
export function NoataAIClient() {
  const {
    historyProps,
    selectFile,
    setMobileHistory,
    temporary,
    activeId,
    conversations,
    busy,
    model,
    setModel,
    scroller,
    follow,
    loading,
    messages,
    signedIn,
    setInput,
    composer,
    copy,
    setDialog,
    setEditValue,
    voiceBusy,
    readAloud,
    send,
    pendingText,
    audioUrl,
    error,
    attachment,
    preview,
    setAttachment,
    showTools,
    input,
    recording,
    elapsed,
    cancelRecording,
    media,
    picker,
    toggleRecording,
    setShowTools,
    abort,
    notice,
    mobileHistory,
    dialog,
    editValue,
    applyDialog,
    sttModel,
    setSttModel,
    ttsModel,
    setTtsModel,
  } = useAIWorkspace();
  return (
    <section className="ai-layout">
      <ConversationHistory {...historyProps} />
      <section
        className="ai-chat"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          selectFile(e.dataTransfer.files[0]);
        }}
      >
        <header className="ai-top">
          <div className="ai-top-title">
            <button
              className="icon-btn ai-sidebar-toggle"
              onClick={() => setMobileHistory(true)}
              aria-label="افتح سجل المحادثات"
            >
              <Icon name="menu" />
            </button>
            <div>
              <b>
                Noata AI <span style={{ color: "var(--accent)" }}>✦</span>
              </b>
              <small>
                {temporary
                  ? "محادثة مؤقتة · لا تُحفظ في السجل"
                  : activeId
                    ? (conversations.find((c) => c.id === activeId)?.title ??
                      "محادثتك")
                    : "مساحة للأفكار، والأسئلة، والاكتشاف."}
              </small>
            </div>
          </div>
          <div className="ai-top-actions">
            <Link className="ai-back" href="/">
              الرئيسية
              <Icon name="arrow" size={15} />
            </Link>
            <select
              aria-label="اختيار المساعد"
              className="model-select"
              disabled={busy}
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="auto">تلقائي · الأنسب لسؤالك</option>
              {FANAR_CAPABILITIES.filter((c) => c.visibleInPicker).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <ThemeControl />
          </div>
        </header>
        <div
          className="ai-messages"
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 90;
          }}
          aria-busy={busy}
        >
          {loading && <div role="status">بنجهّز مساحتك…</div>}
          {!messages.length && !loading && (
            <div className="ai-empty">
              <div className="ai-emblem">
                <Icon name="ai" size={38} />
              </div>
              <span className="tiny-label">MAKE ROOM FOR A NEW IDEA</span>
              <h1>إيه اللي شاغل فضولك؟</h1>
              <p>اسأل، ارفع صورة، أو احكي بصوتك. نفهمها سوا، خطوة بخطوة.</p>
              <div className="ai-prompts">
                {[
                  ["book", "افهم فكرة جديدة", "اشرحلي موضوع صعب بطريقة بسيطة."],
                  [
                    "target",
                    "اختبر فهمي",
                    "اسألني 3 أسئلة عن الموضوع اللي هحدده.",
                  ],
                  ["image", "حلّل صورة", "ساعدني أفهم الصورة اللي هرفعها."],
                  ["edit", "رتّب أفكاري", "ساعدني أعمل خطة مذاكرة واقعية."],
                ].map(([icon, title, prompt]) => (
                  <button
                    key={title}
                    onClick={() => {
                      setInput(prompt);
                      composer.current?.focus();
                    }}
                  >
                    <Icon name={icon} />
                    <span>
                      {title}
                      <small>{prompt}</small>
                    </span>
                  </button>
                ))}
              </div>
              {signedIn === false && (
                <Link
                  href="/login?next=/ai"
                  className="btn"
                  style={{ marginTop: 20, color: "var(--accent)" }}
                >
                  سجّل الدخول علشان نبدأ ←
                </Link>
              )}
            </div>
          )}
          {messages
            .filter((m) => m.role !== "system")
            .map((m, index) => (
              <article key={m.id} className={"message " + m.role}>
                {m.role === "assistant" && (
                  <div className="message-label">
                    <Icon name="ai" size={17} />
                    Noata AI
                  </div>
                )}
                <RichMessage content={m.content} />
                <div className="message-actions">
                  <button
                    onClick={() => void copy(m.content)}
                    aria-label="نسخ الرسالة"
                  >
                    <Icon name="copy" size={15} />
                  </button>
                  {m.role === "user" ? (
                    <button
                      disabled={busy}
                      onClick={() => {
                        setDialog({ kind: "edit", message: m });
                        setEditValue(m.content);
                      }}
                      aria-label="تعديل الرسالة"
                    >
                      <Icon name="edit" size={15} />
                    </button>
                  ) : (
                    <>
                      <button
                        disabled={voiceBusy}
                        onClick={() => void readAloud(m.content)}
                        aria-label="الاستماع للرد"
                      >
                        <Icon name="volume" size={15} />
                      </button>
                      {index === messages.length - 1 && (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => void send(undefined, "regenerate")}
                          >
                            <Icon name="review" size={15} />
                            إعادة الرد
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => void send(undefined, "continue")}
                          >
                            كمّل
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </article>
            ))}
          {pendingText && (
            <article className="message assistant">
              <RichMessage content={pendingText} />
              {!busy && (
                <div className="message-actions">
                  <span>رد غير مكتمل أو غير محفوظ</span>
                  <button onClick={() => void copy(pendingText)}>
                    نسخ النص
                  </button>
                </div>
              )}
            </article>
          )}
          {busy && !pendingText && (
            <div className="thinking" role="status">
              <i />
              <i />
              <i />
              <span>{notice || "بنحضّر فكرتك…"}</span>
            </div>
          )}
          {audioUrl && (
            <audio
              controls
              src={audioUrl}
              style={{ width: "100%" }}
              aria-label="الاستماع للرد"
            />
          )}
          {voiceBusy && <p role="status">بنجهّز الصوت…</p>}
          {error && (
            <div className="error-banner" role="alert">
              {error}
              {messages.at(-1)?.role === "user" && !busy && (
                <button
                  className="btn"
                  onClick={() => void send(undefined, "retry")}
                >
                  إعادة المحاولة
                </button>
              )}
            </div>
          )}
        </div>
        <footer className="ai-composer">
          <form onSubmit={(e) => void send(e)} className="composer-box">
            {attachment && (
              <div className="attachment-preview">
                {preview && <img src={preview} alt="معاينة الصورة المرفقة" />}
                <span>{attachment.name}</span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setAttachment(null)}
                  aria-label="إزالة المرفق"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            )}
            {showTools && (
              <div className="tool-grid">
                {TOOLS.map((t) => (
                  <button
                    key={t.action}
                    type="button"
                    disabled={busy || !input.trim() || Boolean(attachment)}
                    title={t.description}
                    onClick={() => void send(undefined, "send", t.action)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
            {showTools && (
              <div className="filter-bar">
                <label>
                  تحويل الصوت{" "}
                  <select
                    value={sttModel}
                    onChange={(e) => setSttModel(e.target.value)}
                    disabled={busy}
                  >
                    <option value="Fanar-Aura-STT-1">عادي</option>
                    <option value="Fanar-Aura-STT-LF-1">مطوّل</option>
                  </select>
                </label>
                <label>
                  القراءة{" "}
                  <select
                    value={ttsModel}
                    onChange={(e) => setTtsModel(e.target.value)}
                    disabled={voiceBusy}
                  >
                    <option value="Fanar-Aura-TTS-2">Aura</option>
                    <option value="Fanar-Sadiq-TTS-1">صادق · نص قرآني</option>
                  </select>
                </label>
                <Link href="/privacy">خصوصية المحادثات والملفات</Link>
              </div>
            )}
            {recording && (
              <div className="recording-state" role="status">
                <Icon name="mic" size={16} />
                بنسجّل · {Math.floor(elapsed / 60)}:
                {String(elapsed % 60).padStart(2, "0")}
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    cancelRecording.current = true;
                    media.current?.stop();
                  }}
                >
                  إلغاء
                </button>
              </div>
            )}
            <textarea
              ref={composer}
              aria-label="رسالتك إلى Noata"
              value={input}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onPaste={(e) => {
                const file = Array.from(e.clipboardData.files)[0];
                if (file) {
                  e.preventDefault();
                  selectFile(file);
                }
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  !e.nativeEvent.isComposing
                ) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="اسأل براحتك… كل فكرة ليها بداية."
              rows={2}
            />
            <input
              ref={picker}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
            <div className="composer-actions">
              <div className="composer-tools">
                <button
                  className="icon-btn"
                  type="button"
                  disabled={busy || recording}
                  aria-label="إرفاق صورة أو صوت"
                  onClick={() => picker.current?.click()}
                >
                  <Icon name="plus" size={19} />
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  disabled={busy}
                  aria-label={recording ? "إنهاء التسجيل" : "تسجيل صوت"}
                  onClick={() => void toggleRecording()}
                >
                  <Icon name={recording ? "check" : "mic"} size={18} />
                </button>
                <button
                  type="button"
                  className="filter-chip"
                  aria-expanded={showTools}
                  onClick={() => setShowTools((x) => !x)}
                >
                  أدوات
                </button>
              </div>
              {busy ? (
                <button
                  className="send-btn"
                  type="button"
                  onClick={() => abort.current?.abort()}
                >
                  إيقاف <Icon name="close" size={15} />
                </button>
              ) : (
                <button
                  className="send-btn"
                  type="submit"
                  disabled={!input.trim() || recording}
                >
                  إرسال
                  <Icon name="send" size={16} />
                </button>
              )}
            </div>
          </form>
          <p className="composer-note" role="status">
            {notice && !busy
              ? notice
              : temporary
                ? "المحادثة لا تظهر في السجل. يحتفظ الخادم بالرد مؤقتًا لمنع التكرار، وتبقى الملفات في حسابك. راجع الخصوصية."
                : "Noata ممكن يخطئ. راجع المعلومات المهمة. Enter للإرسال · Shift + Enter لسطر جديد"}
          </p>
        </footer>
      </section>
      <Dialog
        open={mobileHistory}
        onClose={() => setMobileHistory(false)}
        title="محادثاتك"
      >
        <div className="ai-mobile-history">
          <ConversationHistory {...historyProps} />
        </div>
      </Dialog>
      <Dialog
        open={Boolean(dialog)}
        onClose={() => {
          if (!busy) setDialog(null);
        }}
        title={
          dialog?.kind === "delete"
            ? "حذف المحادثة؟"
            : dialog?.kind === "edit"
              ? "تعديل من هنا"
              : "اسم المحادثة"
        }
      >
        {dialog?.kind === "delete" ? (
          <p>
            سيتم حذف هذه المحادثة ورسائلها من حسابك. لا يمكن التراجع عن الحذف.
          </p>
        ) : (
          <>
            <p>
              {dialog?.kind === "edit"
                ? "التعديل يحذف هذه الرسالة والردود بعدها. راجع النص ثم أرسله من جديد."
                : ""}
            </p>
            <textarea
              className="search"
              style={{ width: "100%", minHeight: 90 }}
              aria-label="النص الجديد"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          </>
        )}
        <div className="hero-actions">
          <button
            className="send-btn"
            disabled={busy || (dialog?.kind !== "delete" && !editValue.trim())}
            onClick={() => void applyDialog()}
          >
            {dialog?.kind === "delete" ? "حذف نهائي" : "تأكيد"}
          </button>
          <button
            className="filter-chip"
            disabled={busy}
            onClick={() => setDialog(null)}
          >
            إلغاء
          </button>
        </div>
      </Dialog>
    </section>
  );
}
