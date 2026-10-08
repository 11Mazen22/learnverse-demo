"use client";
/*
 * Noata AI full workspace.
 * UX structure and interaction patterns are adapted from Open WebUI v0.6.5
 * (Sidebar, Navbar/ModelSelector, Messages, MessageInput, Controls/Settings)
 * under BSD-3-Clause. This is a React/Next.js port integrated with Noata's
 * Supabase persistence, authentication and Fanar backend.
 * See docs/THIRD_PARTY_NOTICES.md.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FANAR_CAPABILITIES } from "@/lib/ai/catalog";
import { TOOLS } from "@/lib/ai/workspace";
import { downloadNoataDocx } from "@/lib/ai/docx-export";
import { AttachmentMessage } from "./attachment-message";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { ThemeControl } from "@/components/preferences/theme-control";
import { ConversationHistory } from "./conversation-history";
import { RichMessage } from "./rich-message";
import { useAIWorkspace } from "./use-ai-workspace";

type SettingsTab = "general" | "models" | "voice" | "privacy";

function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type: type + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function NoataAIClient() {
  const workspace = useAIWorkspace();
  const {
    historyProps,
    selectFile,
    captureScreen,
    setMobileHistory,
    temporary,
    newChat,
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
    voiceRequestMessageId,
    readAloud,
    stopVoice,
    audioElement,
    send,
    pendingText,
    audioPlayback,
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
    savePreferences,
    setNotice,
    sttModel,
    setSttModel,
    ttsModel,
    setTtsModel,
  } = workspace;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [inputMenuOpen, setInputMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [activeId, conversations],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        newChat();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        composer.current?.focus();
      } else if ((event.ctrlKey || event.metaKey) && event.key === ",") {
        event.preventDefault();
        setSettingsOpen(true);
      } else if (event.key === "Escape") {
        setInputMenuOpen(false);
        setModelMenuOpen(false);
        setControlsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [composer, newChat]);

  function exportConversation(format: "markdown" | "json" | "docx") {
    const stamp = new Date().toISOString().slice(0, 10);
    const title = (activeConversation?.title || "noata-ai-chat").replace(/[\\/:*?"<>|]/g, "-");
    if (format === "docx") {
      const body = "# " + (activeConversation?.title ?? "محادثة Noata AI") + "\n\n" +
        messages.filter(m => m.role !== "system")
          .map(m => (m.role === "user" ? "## أنت" : "## Noata AI") + "\n" + m.content)
          .join("\n\n");
      if (body.length > 200000) {
        setNotice("المحادثة طويلة جدًا لملف واحد. صدّرها بصيغة Markdown.");
        return;
      }
      downloadNoataDocx(body, title + "-" + stamp + ".docx");
    } else if (format === "json") {
      downloadText(
        title + "-" + stamp + ".json",
        JSON.stringify(
          {
            title: activeConversation?.title ?? "Noata AI",
            model,
            temporary,
            exportedAt: new Date().toISOString(),
            messages: messages.filter((m) => m.role !== "system"),
          },
          null,
          2,
        ),
        "application/json",
      );
    } else {
      const body = messages
        .filter((m) => m.role !== "system")
        .map((m) => (m.role === "user" ? "## أنت\n\n" : "## Noata AI\n\n") + m.content)
        .join("\n\n---\n\n");
      downloadText(title + "-" + stamp + ".md", "# " + (activeConversation?.title ?? "Noata AI") + "\n\n" + body, "text/markdown");
    }
    setNotice("تم تصدير المحادثة.");
  }

  const sidebar = (
    <ConversationHistory
      {...historyProps}
      collapsed={sidebarCollapsed}
      onToggleCollapse={() => setSidebarCollapsed((x) => !x)}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenShortcuts={() => setShortcutsOpen(true)}
    />
  );

  return (
    <section className={"owui-layout " + (sidebarCollapsed ? "sidebar-collapsed" : "")}>
      {sidebar}

      <section
        className="owui-main"
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          if (e.currentTarget === e.target) setDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          selectFile(e.dataTransfer.files[0]);
        }}
      >
        {dragging && (
          <div className="owui-drop-overlay" role="status">
            <Icon name="image" size={34} />
            <strong>سيب الصورة أو الملف الصوتي هنا</strong>
            <span>Noata AI هيجهزه للمحادثة</span>
          </div>
        )}

        <header className="owui-navbar">
          <div className="owui-navbar-start">
            <button
              type="button"
              className="owui-icon mobile-sidebar-trigger"
              onClick={() => setMobileHistory(true)}
              aria-label="فتح سجل المحادثات"
            >
              <Icon name="menu" />
            </button>
            {sidebarCollapsed && (
              <button
                type="button"
                className="owui-icon desktop-sidebar-trigger"
                onClick={() => setSidebarCollapsed(false)}
                aria-label="فتح القائمة الجانبية"
              >
                <Icon name="sidebar" />
              </button>
            )}

            <div className="owui-model-picker">
              <button
                type="button"
                className="owui-model-trigger"
                onClick={() => setModelMenuOpen((x) => !x)}
                aria-expanded={modelMenuOpen}
              >
                <span>
                  <small>النموذج</small>
                  <strong>
                    {model === "auto"
                      ? "تلقائي · الأنسب لسؤالك"
                      : FANAR_CAPABILITIES.find((c) => c.id === model)?.label ?? model}
                  </strong>
                </span>
                <Icon name="chevron" size={15} />
              </button>
              {modelMenuOpen && (
                <div className="owui-model-menu" role="menu">
                  <button
                    type="button"
                    className={model === "auto" ? "active" : ""}
                    onClick={() => {
                      setModel("auto");
                      setModelMenuOpen(false);
                    }}
                  >
                    <span className="owui-model-dot auto" />
                    <span>
                      <strong>تلقائي</strong>
                      <small>Noata يختار أنسب قدرة Fanar تلقائيًا</small>
                    </span>
                  </button>
                  {FANAR_CAPABILITIES.filter((c) => c.visibleInPicker).map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      className={model === c.id ? "active" : ""}
                      onClick={() => {
                        setModel(c.id);
                        setModelMenuOpen(false);
                      }}
                    >
                      <span className={"owui-model-dot " + c.category} />
                      <span>
                        <strong>{c.label}</strong>
                        <small>{c.use} · {c.quota}</small>
                      </span>
                    </button>
                  ))}
                  <div className="owui-model-menu-foot">
                    <button type="button" onClick={() => setSettingsOpen(true)}>
                      <Icon name="settings" size={14} />
                      إعدادات النماذج
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="owui-navbar-center">
            {temporary ? (
              <span className="owui-status-pill temporary">
                <Icon name="clock" size={13} />
                مؤقتة
              </span>
            ) : activeConversation ? (
              <span className="owui-chat-heading" title={activeConversation.title}>
                {activeConversation.title}
              </span>
            ) : (
              <span className="owui-chat-heading">Noata AI</span>
            )}
          </div>

          <div className="owui-navbar-actions">
            <Link className="owui-icon" href="/" title="الرجوع إلى لوحة Noata" aria-label="الرجوع إلى لوحة Noata">
              <Icon name="home" />
            </Link>
            <button
              type="button"
              className="owui-icon"
              onClick={() => setControlsOpen(true)}
              aria-label="عناصر التحكم"
              title="عناصر التحكم"
            >
              <Icon name="sliders" />
            </button>
            <button
              type="button"
              className="owui-icon"
              onClick={() => exportConversation("markdown")}
              disabled={!messages.length}
              aria-label="تصدير المحادثة"
              title="تصدير المحادثة"
            >
              <Icon name="download" />
            </button>
            <button
              type="button"
              className="owui-icon"
              onClick={() => newChat()}
              disabled={busy}
              aria-label="محادثة جديدة"
              title="محادثة جديدة"
            >
              <Icon name="edit" />
            </button>
            <ThemeControl />
          </div>
        </header>

        <div
          className="owui-messages"
          id="messages-container"
          ref={scroller}
          onScroll={(e) => {
            const el = e.currentTarget;
            follow.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
          }}
          aria-busy={busy}
        >
          {loading && (
            <div className="owui-loading" role="status">
              <span />
              <span />
              <span />
              <p>بنجهّز مساحة Noata AI…</p>
            </div>
          )}

          {!messages.length && !loading && (
            <div className="owui-welcome">
              <div className="owui-welcome-logo">
                <span>n·</span>
              </div>
              <h1>{signedIn === false ? "أهلًا بيك في Noata AI" : "إزاي أقدر أساعدك النهارده؟"}</h1>
              <p>
                اسأل، ارفع صورة، التقط شاشة، أو اتكلم بصوتك. Noata توجّه طلبك لأفضل قدرة Fanar تلقائيًا.
              </p>
              <div className="owui-suggestions">
                {[
                  ["book", "اشرحلي مفهوم صعب", "اشرحلي مفهوم صعب بطريقة بسيطة وبعدها اختبر فهمي."],
                  ["target", "اختبر فهمي", "اسألني 3 أسئلة متدرجة عن موضوع هقولهولك."],
                  ["image", "حلّل صورة", "هرفع صورة، ساعدني أفهم كل اللي فيها خطوة بخطوة."],
                  ["edit", "رتّب مذاكرتي", "ساعدني أعمل خطة مذاكرة واقعية ومنظمة."],
                ].map(([icon, title, prompt]) => (
                  <button
                    type="button"
                    key={title}
                    onClick={() => {
                      setInput(prompt);
                      composer.current?.focus();
                    }}
                  >
                    <Icon name={icon} size={18} />
                    <span>
                      <strong>{title}</strong>
                      <small>{prompt}</small>
                    </span>
                  </button>
                ))}
              </div>
              {signedIn === false && (
                <Link className="owui-primary-action" href="/login?next=/ai">
                  سجّل الدخول وابدأ
                  <Icon name="arrow" size={15} />
                </Link>
              )}
            </div>
          )}

          <div className="owui-thread">
            {messages
              .filter((m) => m.role !== "system")
              .map((m, index) => (
                <article key={m.id} className={"owui-message " + m.role}>
                  <div className="owui-message-avatar" aria-hidden="true">
                    {m.role === "assistant" ? "n·" : "أنت"}
                  </div>
                  <div className="owui-message-body">
                    <div className="owui-message-meta">
                      <strong>{m.role === "assistant" ? "Noata AI" : "أنت"}</strong>
                      {m.role === "assistant" && m.model && <span>{m.model}</span>}
                    </div>
                    <RichMessage content={m.content} />
                    {m.role === "user" && <AttachmentMessage metadata={m.metadata} />}
                    <div className="owui-message-actions">
                      <button type="button" onClick={() => void copy(m.content)} title="نسخ" aria-label="نسخ الرسالة">
                        <Icon name="copy" size={14} />
                      </button>
                      {m.role === "user" ? (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setDialog({ kind: "edit", message: m });
                            setEditValue(m.content);
                          }}
                          title="تعديل"
                          aria-label="تعديل الرسالة"
                        >
                          <Icon name="edit" size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={voiceBusy}
                            onClick={() => void readAloud(m.content, m.id)}
                            title="استماع"
                            aria-label="الاستماع للرد"
                          >
                            <Icon name="volume" size={14} />
                          </button>
                          {index === messages.length - 1 && (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void send(undefined, "regenerate")}
                                title="إعادة توليد الرد"
                              >
                                <Icon name="review" size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void send(undefined, "continue")}
                                title="كمّل الرد"
                              >
                                <Icon name="arrow" size={14} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {voiceBusy && voiceRequestMessageId === m.id && (
                      <p className="owui-voice-pending" role="status">
                        بنجهّز التسجيل الصوتي لهذا الرد…
                        <button type="button" onClick={stopVoice}>إلغاء</button>
                      </p>
                    )}
                    {audioPlayback?.messageId === m.id && (
                      <div className="owui-inline-player" role="group" aria-label="مشغل صوت الرد">
                        <div className="owui-inline-player-head">
                          <Icon name="volume" size={16} />
                          <strong>استمع إلى رد Noata</strong>
                          <label className="owui-playback-speed">
                            <span>السرعة</span>
                            <select
                              defaultValue="1"
                              aria-label="سرعة تشغيل الرد الصوتي"
                              onChange={(event) => {
                                if (audioElement.current) {
                                  audioElement.current.playbackRate = Number(event.target.value);
                                }
                              }}
                            >
                              <option value="0.75">0.75×</option>
                              <option value="1">1×</option>
                              <option value="1.25">1.25×</option>
                              <option value="1.5">1.5×</option>
                              <option value="2">2×</option>
                            </select>
                          </label>
                          <button
                            type="button"
                            onClick={stopVoice}
                            title="إيقاف وإغلاق الرد الصوتي"
                            aria-label="إيقاف وإغلاق الرد الصوتي"
                          >
                            <Icon name="close" size={15} />
                          </button>
                        </div>
                        <audio
                          key={audioPlayback.url}
                          ref={audioElement}
                          controls
                          preload="metadata"
                          src={audioPlayback.url}
                          aria-label="تشغيل الرد الصوتي لهذه الرسالة"
                          onError={() => {
                            stopVoice();
                            setNotice("تعذّر تشغيل الصوت. جرّب توليده مرة تانية.");
                          }}
                        />
                      </div>
                    )}
                  </div>
                </article>
              ))}

            {pendingText && (
              <article className="owui-message assistant streaming">
                <div className="owui-message-avatar" aria-hidden="true">n·</div>
                <div className="owui-message-body">
                  <div className="owui-message-meta">
                    <strong>Noata AI</strong>
                    <span className="owui-stream-badge">{busy ? "يكتب…" : "رد غير مكتمل"}</span>
                  </div>
                  <RichMessage content={pendingText} />
                  {!busy && (
                    <div className="owui-message-actions">
                      <button type="button" onClick={() => void copy(pendingText)}>
                        <Icon name="copy" size={14} />
                        نسخ
                      </button>
                    </div>
                  )}
                </div>
              </article>
            )}

            {busy && !pendingText && (
              <div className="owui-thinking" role="status">
                <div className="owui-message-avatar" aria-hidden="true">n·</div>
                <span /><span /><span />
                <em>{notice || "Noata بتفكر…"}</em>
              </div>
            )}

            {error && (
              <div className="owui-error" role="alert">
                <Icon name="help" />
                <div>
                  <strong>مقدرناش نكمل الطلب</strong>
                  <p>{error}</p>
                </div>
                {messages.at(-1)?.role === "user" && !busy && (
                  <button type="button" onClick={() => void send(undefined, "retry")}>
                    إعادة المحاولة
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="owui-composer-wrap">
          <form onSubmit={(e) => void send(e)} className="owui-composer">
            {attachment && (
              <div className="owui-attachment">
                {preview ? (
                  <img src={preview} alt="معاينة المرفق" />
                ) : (
                  <div className="owui-file-icon"><Icon name="chat" /></div>
                )}
                <div>
                  <strong>{attachment.name}</strong>
                  <small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small>
                </div>
                <button
                  type="button"
                  className="owui-icon"
                  onClick={() => setAttachment(null)}
                  aria-label="إزالة المرفق"
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            )}

            {recording && (
              <div className="owui-recording" role="status">
                <span className="owui-recording-dot" />
                <strong>تسجيل</strong>
                <time>{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</time>
                <button
                  type="button"
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
              aria-label="رسالتك إلى Noata AI"
              value={input}
              maxLength={8000}
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
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="ابعت رسالة لـ Noata AI"
              rows={1}
            />

            <input
              ref={picker}
              type="file"
              hidden
              accept="image/jpeg,image/png,image/webp,audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav,.txt,.md,.markdown,.csv,.json,text/plain,text/markdown,text/csv,application/json"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />

            <div className="owui-composer-toolbar">
              <div className="owui-composer-left">
                <div className="owui-input-menu-wrap">
                  <button
                    className="owui-round"
                    type="button"
                    disabled={busy || recording}
                    aria-label="إضافة مرفق أو أداة"
                    aria-expanded={inputMenuOpen}
                    onClick={() => setInputMenuOpen((x) => !x)}
                  >
                    <Icon name="plus" size={19} />
                  </button>
                  {inputMenuOpen && (
                    <div className="owui-input-menu">
                      <button
                        type="button"
                        onClick={() => {
                          picker.current?.click();
                          setInputMenuOpen(false);
                        }}
                      >
                        <Icon name="image" size={17} />
                        <span><strong>رفع صورة أو مستند</strong><small>صورة، صوت أو ملف نصي (TXT / MD / CSV / JSON)</small></span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void captureScreen();
                          setInputMenuOpen(false);
                        }}
                      >
                        <Icon name="screen" size={17} />
                        <span><strong>التقط الشاشة</strong><small>شارك شاشة واختر لقطة للمحادثة</small></span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTools(true);
                          setInputMenuOpen(false);
                        }}
                      >
                        <Icon name="sparkles" size={17} />
                        <span><strong>أدوات Fanar</strong><small>صورة، ترجمة، شعر، بحث وتحقق</small></span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className={"owui-tool-toggle " + (showTools ? "active" : "")}
                  onClick={() => setShowTools((x) => !x)}
                  aria-pressed={showTools}
                >
                  <Icon name="sparkles" size={15} />
                  أدوات
                </button>

                <button
                  className="owui-round"
                  type="button"
                  disabled={busy}
                  aria-label={recording ? "إنهاء التسجيل" : "تسجيل رسالة صوتية"}
                  onClick={() => void toggleRecording()}
                >
                  <Icon name={recording ? "stop" : "mic"} size={18} />
                </button>
              </div>

              <div className="owui-composer-right">
                {input.trim() && <span className="owui-char-count">{input.length.toLocaleString("ar-EG")}</span>}
                {busy ? (
                  <button
                    className="owui-send stop"
                    type="button"
                    onClick={() => abort.current?.abort()}
                    aria-label="إيقاف التوليد"
                  >
                    <Icon name="stop" size={16} />
                  </button>
                ) : (
                  <button
                    className="owui-send"
                    type="submit"
                    disabled={(!input.trim() && !attachment) || recording}
                    aria-label="إرسال"
                  >
                    <Icon name="arrow" size={17} />
                  </button>
                )}
              </div>
            </div>

            {showTools && (
              <div className="owui-tool-panel">
                <div className="owui-tool-panel-head">
                  <div>
                    <strong>أدوات Noata AI</strong>
                    <small>تُنفّذ كقدرات Fanar مخصصة</small>
                  </div>
                  <button type="button" className="owui-icon" onClick={() => setShowTools(false)}>
                    <Icon name="close" size={15} />
                  </button>
                </div>
                <div className="owui-tool-list">
                  {TOOLS.map((tool) => (
                    <button
                      key={tool.action}
                      type="button"
                      disabled={busy || !input.trim() || Boolean(attachment)}
                      onClick={() => void send(undefined, "send", tool.action)}
                    >
                      <Icon name={tool.icon} size={17} />
                      <span>
                        <strong>{tool.label}</strong>
                        <small>{tool.description}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          <p className="owui-disclaimer">
            {temporary
              ? "محادثة مؤقتة · لا تظهر في سجل المحادثات."
              : notice || "Noata AI ممكن تخطئ. راجع المعلومات المهمة."}
          </p>
        </footer>
      </section>

      <Dialog
        open={mobileHistory}
        onClose={() => setMobileHistory(false)}
        title="محادثاتك"
      >
        <div className="owui-mobile-sidebar">
          <ConversationHistory
            {...historyProps}
            collapsed={false}
            onOpenSettings={() => {
              setMobileHistory(false);
              setSettingsOpen(true);
            }}
            onOpenShortcuts={() => {
              setMobileHistory(false);
              setShortcutsOpen(true);
            }}
          />
        </div>
      </Dialog>

      <Dialog
        open={controlsOpen}
        onClose={() => setControlsOpen(false)}
        title="عناصر تحكم Noata AI"
      >
        <div className="owui-control-grid">
          <label>
            <span>نموذج المحادثة</span>
            <select value={model} onChange={(e) => setModel(e.target.value)} disabled={busy}>
              <option value="auto">تلقائي · Noata تختار الأفضل</option>
              {FANAR_CAPABILITIES.filter((c) => c.visibleInPicker).map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>تحويل الصوت إلى نص</span>
            <select value={sttModel} onChange={(e) => setSttModel(e.target.value)}>
              <option value="Fanar-Aura-STT-1">Aura STT</option>
              <option value="Fanar-Aura-STT-LF-1">Aura STT · Long Form</option>
            </select>
          </label>
          <label>
            <span>قراءة الردود</span>
            <select value={ttsModel} onChange={(e) => setTtsModel(e.target.value)}>
              <option value="Fanar-Aura-TTS-2">Aura TTS</option>
              <option value="Fanar-Sadiq-TTS-1">Sadiq · Quran TTS</option>
            </select>
          </label>
          <button type="button" className={"owui-setting-switch " + (temporary ? "active" : "")} onClick={historyProps.onTemporary}>
            <span><strong>محادثة مؤقتة</strong><small>لا تضيف المحادثة الحالية إلى السجل</small></span>
            <i>{temporary ? "ON" : "OFF"}</i>
          </button>
        </div>
        <div className="owui-dialog-actions">
          <button type="button" className="owui-primary-action" onClick={() => setControlsOpen(false)}>تم</button>
          <button type="button" onClick={() => { setControlsOpen(false); setSettingsOpen(true); }}>كل الإعدادات</button>
        </div>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="إعدادات Noata AI"
      >
        <div className="owui-settings">
          <nav className="owui-settings-tabs" aria-label="أقسام الإعدادات">
            {([
              ["general", "عام", "sliders"],
              ["models", "النماذج", "ai"],
              ["voice", "الصوت", "mic"],
              ["privacy", "الخصوصية", "archive"],
            ] as const).map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={settingsTab === id ? "active" : ""}
                onClick={() => setSettingsTab(id)}
              >
                <Icon name={icon} size={15} />
                {label}
              </button>
            ))}
          </nav>

          <div className="owui-settings-content">
            {settingsTab === "general" && (
              <>
                <h3>سلوك المحادثة</h3>
                <button type="button" className={"owui-setting-switch " + (temporary ? "active" : "")} onClick={historyProps.onTemporary}>
                  <span>
                    <strong>الوضع المؤقت</strong>
                    <small>المحادثات الجديدة لا تُضاف إلى السجل</small>
                  </span>
                  <i>{temporary ? "ON" : "OFF"}</i>
                </button>
                <button type="button" className="owui-setting-switch" onClick={() => setShortcutsOpen(true)}>
                  <span>
                    <strong>اختصارات لوحة المفاتيح</strong>
                    <small>افتح قائمة الاختصارات المتاحة</small>
                  </span>
                  <Icon name="keyboard" size={18} />
                </button>
              </>
            )}

            {settingsTab === "models" && (
              <>
                <h3>النموذج الافتراضي</h3>
                <p>اختار قدرة محددة أو سيب Noata تختار تلقائيًا حسب سؤالك والمرفقات.</p>
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  <option value="auto">تلقائي · الأنسب لسؤالك</option>
                  {FANAR_CAPABILITIES.filter((c) => c.visibleInPicker).map((c) => (
                    <option key={c.id} value={c.id}>{c.label} · {c.quota}</option>
                  ))}
                </select>
                <div className="owui-capability-list">
                  {FANAR_CAPABILITIES.map((c) => (
                    <div key={c.id}>
                      <span className={"owui-model-dot " + c.category} />
                      <span><strong>{c.label}</strong><small>{c.use} · {c.quota}</small></span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {settingsTab === "voice" && (
              <>
                <h3>الصوت</h3>
                <label>
                  <span>Speech to Text</span>
                  <select value={sttModel} onChange={(e) => setSttModel(e.target.value)}>
                    <option value="Fanar-Aura-STT-1">Fanar Aura STT</option>
                    <option value="Fanar-Aura-STT-LF-1">Fanar Aura STT Long Form</option>
                  </select>
                </label>
                <label>
                  <span>Text to Speech</span>
                  <select value={ttsModel} onChange={(e) => setTtsModel(e.target.value)}>
                    <option value="Fanar-Aura-TTS-2">Fanar Aura TTS 2</option>
                    <option value="Fanar-Sadiq-TTS-1">Fanar Sadiq Quran TTS</option>
                  </select>
                </label>
                <p>الميكروفون لا يبدأ إلا بإذن المتصفح. التسجيل يُحوّل إلى نص قبل الإرسال حتى تراجعه.</p>
              </>
            )}

            {settingsTab === "privacy" && (
              <>
                <h3>الخصوصية والبيانات</h3>
                <p>سجل المحادثات والملفات مرتبط بحسابك ومحمي بسياسات Supabase. مفاتيح Fanar لا تصل إلى المتصفح.</p>
                <div className="owui-privacy-links">
                  <Link href="/privacy">سياسة الخصوصية</Link>
                  <Link href="/terms">الشروط</Link>
                </div>
                <h3>تصدير المحادثة الحالية</h3>
                <div className="owui-export-actions">
                  <button type="button" disabled={!messages.length} onClick={() => exportConversation("markdown")}>Markdown</button>
                  <button type="button" disabled={!messages.length} onClick={() => exportConversation("json")}>JSON</button>
                  <button type="button" disabled={!messages.length} onClick={() => exportConversation("docx")}>Word DOCX</button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="owui-dialog-actions">
          <button
            type="button"
            className="owui-primary-action"
            onClick={async () => {
              const ok = await savePreferences();
              if (ok) setSettingsOpen(false);
            }}
          >
            حفظ التفضيلات
          </button>
          <button type="button" onClick={() => setSettingsOpen(false)}>إلغاء</button>
        </div>
      </Dialog>

      <Dialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="اختصارات Noata AI"
      >
        <div className="owui-shortcuts">
          <div><span>محادثة جديدة</span><kbd>Ctrl</kbd><kbd>Shift</kbd><kbd>O</kbd></div>
          <div><span>التركيز على مربع الرسالة</span><kbd>Ctrl</kbd><kbd>K</kbd></div>
          <div><span>فتح الإعدادات</span><kbd>Ctrl</kbd><kbd>,</kbd></div>
          <div><span>إرسال الرسالة</span><kbd>Enter</kbd></div>
          <div><span>سطر جديد</span><kbd>Shift</kbd><kbd>Enter</kbd></div>
          <div><span>إغلاق القوائم</span><kbd>Esc</kbd></div>
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
              ? "تعديل الرسالة"
              : "إعادة تسمية المحادثة"
        }
      >
        {dialog?.kind === "delete" ? (
          <p>سيتم حذف المحادثة ورسائلها من حسابك نهائيًا. لا يمكن التراجع عن الحذف.</p>
        ) : (
          <>
            {dialog?.kind === "edit" && (
              <p>سيتم حذف هذه الرسالة والردود التي بعدها، وبعدها تقدر تبعت النسخة المعدلة.</p>
            )}
            <textarea
              className="owui-dialog-textarea"
              aria-label="النص الجديد"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          </>
        )}
        <div className="owui-dialog-actions">
          <button
            className="owui-primary-action"
            disabled={busy || (dialog?.kind !== "delete" && !editValue.trim())}
            onClick={() => void applyDialog()}
          >
            {dialog?.kind === "delete" ? "حذف نهائي" : "تأكيد"}
          </button>
          <button type="button" disabled={busy} onClick={() => setDialog(null)}>إلغاء</button>
        </div>
      </Dialog>
    </section>
  );
}
