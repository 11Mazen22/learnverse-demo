"use client";
/*
 * Noata AI full workspace.
 * UX structure and interaction patterns are adapted from Open WebUI v0.6.5
 * (Sidebar, Navbar/ModelSelector, Messages, MessageInput, Controls/Settings)
 * under BSD-3-Clause. This is a React/Next.js port integrated with Noata's
 * Supabase persistence, authentication and Fanar backend.
 * See docs/THIRD_PARTY_NOTICES.md.
 */
import { NoataLogo } from "@/components/ui/noata-logo";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FANAR_CAPABILITIES } from "@/lib/ai/catalog";
import {
  CHAT_MODEL_CARDS,
  resolveSuggestedModel,
} from "@/lib/ai/model-routing";
import { TOOLS } from "@/lib/ai/workspace";
import { downloadNoataDocx } from "@/lib/ai/docx-export";
import { AttachmentMessage } from "./attachment-message";
import { DocumentSourcesMessage } from "./document-sources-message";
import { OriginalDocumentPreview } from "./original-document-preview";
import { stageOriginalDocument } from "@/lib/ai/original-documents";
import { ResponseAudioPlayer } from "./response-audio-player";
import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { WritingStudio } from "./writing-studio";
import { EducationPanel } from "./education-panel";
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
    selectFiles,
    documentFiles,
    setDocumentFiles,
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

  // Suggested prompts and completed response text are not unsaved user work.
  // Warn only when the student has actually edited the composer or staged a
  // locally selected document that would be lost on navigation.
  const [hasTypedDraft, setHasTypedDraft] = useState(false);
  useUnsavedWork(
    Boolean((hasTypedDraft && input.trim()) || documentFiles.length || attachment),
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [inputMenuOpen, setInputMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [studio, setStudio] = useState<{
    source: string;
    key: string;
    session: number;
  } | null>(null);
  function setStudioSource(source: string | null, key = "composer") {
    setStudio(
      source === null
        ? null
        : { source, key, session: workspace.sessionVersion },
    );
  }
  const [educationOpen, setEducationOpen] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<{
    name: string;
    localId: string;
    format: string;
  } | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [activeId, conversations],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === "o"
      ) {
        event.preventDefault();
        newChat();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
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
    const title = (activeConversation?.title || "noata-ai-chat").replace(
      /[\\/:*?"<>|]/g,
      "-",
    );
    if (format === "docx") {
      const body =
        "# " +
        (activeConversation?.title ?? "محادثة Noata AI") +
        "\n\n" +
        messages
          .filter((m) => m.role !== "system")
          .map(
            (m) =>
              (m.role === "user" ? "## أنت" : "## Noata AI") + "\n" + m.content,
          )
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
        .map(
          (m) =>
            (m.role === "user" ? "## أنت\n\n" : "## Noata AI\n\n") + m.content,
        )
        .join("\n\n---\n\n");
      downloadText(
        title + "-" + stamp + ".md",
        "# " + (activeConversation?.title ?? "Noata AI") + "\n\n" + body,
        "text/markdown",
      );
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
    <section
      className={"owui-layout " + (sidebarCollapsed ? "sidebar-collapsed" : "")}
    >
      {sidebar}

      <section
        className="owui-main"
        id="noata-main"
        role="main"
        tabIndex={-1}
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
          selectFiles(e.dataTransfer.files);
        }}
      >
        {dragging && (
          <div className="owui-drop-overlay" role="status">
            <Icon name="image" size={34} />
            <strong>ارفع مستنداتك أو صورتك</strong>
            <span>
              حتى ٤ ملفات TXT أو DOCX وملف صورة واحد — الملفات غير المدعومة تظهر
              رسالة توضيحية
            </span>
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
                      : (CHAT_MODEL_CARDS.find((c) => c.id === model)?.arabic ??
                        model)}
                  </strong>
                </span>
                <Icon name="chevron" size={15} />
              </button>
              {modelMenuOpen && (
                <div
                  className="owui-model-menu aura-model-gallery"
                  role="group"
                  aria-label="النماذج المهيأة على خادم Noata"
                >
                  <div className="aura-model-gallery-head">
                    <strong>اختار مساعدك</strong>
                    <span>فنار · النماذج المهيأة بالخادم</span>
                  </div>
                  <button
                    type="button"
                    className={
                      "aura-model-card aura-model-auto " +
                      (model === "auto" ? "active" : "")
                    }
                    aria-pressed={model === "auto"}
                    onClick={() => {
                      setModel("auto");
                      setModelMenuOpen(false);
                    }}
                  >
                    <span className="aura-model-card-symbol">
                      <Icon name="ai" size={20} />
                    </span>
                    <span className="aura-model-card-copy">
                      <strong>تلقائي · Aura Smart</strong>
                      <small>
                        اختيار مبني على نوع السؤال، وليس نموذجًا ثابتًا
                      </small>
                      <span className="aura-model-features">
                        {input.trim()
                          ? "المقترح لهذا السؤال: " +
                            (CHAT_MODEL_CARDS.find(
                              (c) =>
                                c.id ===
                                resolveSuggestedModel(
                                  input,
                                  Boolean(
                                    attachment &&
                                      attachment.type.startsWith("image/"),
                                  ),
                                ),
                            )?.arabic ?? "فنار")
                          : "محادثة · منطق · أسئلة إسلامية · رؤية"}
                      </span>
                    </span>
                    {model === "auto" && <Icon name="check" size={17} />}
                  </button>
                  <div className="aura-model-gallery-list">
                    {CHAT_MODEL_CARDS.map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        className={
                          "aura-model-card " + (model === c.id ? "active" : "")
                        }
                        aria-pressed={model === c.id}
                        onClick={() => {
                          setModel(c.id);
                          setModelMenuOpen(false);
                        }}
                      >
                        <span className="aura-model-card-symbol">
                          <Icon
                            name={
                              c.bestFor === "vision"
                                ? "image"
                                : c.bestFor === "islamic"
                                  ? "book"
                                  : c.bestFor === "fast"
                                    ? "target"
                                    : "ai"
                            }
                            size={20}
                          />
                        </span>
                        <span className="aura-model-card-copy">
                          <strong>
                            {c.arabic}
                            <span>{c.subtitle}</span>
                          </strong>
                          <small>{c.description}</small>
                          <span className="aura-model-features">
                            {c.features.join(" · ")}
                          </span>
                        </span>
                        {model === c.id && <Icon name="check" size={17} />}
                      </button>
                    ))}
                  </div>
                  <div className="owui-model-menu-foot aura-model-info">
                    <small>
                      مهيّأ على Edge Function، والتوفر الفعلي يتضح عند إرسال
                      الطلب. لا يوجد اختبار صحة مباشر لكل نموذج هنا.
                    </small>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(true);
                        setModelMenuOpen(false);
                      }}
                    >
                      <Icon name="settings" size={14} /> الإعدادات
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
              <span
                className="owui-chat-heading"
                title={activeConversation.title}
              >
                {activeConversation.title}
              </span>
            ) : (
              <span className="owui-chat-heading">Noata AI</span>
            )}
          </div>

          <div className="owui-navbar-actions">
            <Link
              className="owui-icon"
              href="/"
              title="الرجوع إلى لوحة Noata"
              aria-label="الرجوع إلى لوحة Noata"
            >
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
            <button
              type="button"
              className="owui-icon"
              title="ورشة المذاكرة"
              aria-label="افتح ورشة المذاكرة"
              onClick={() => setEducationOpen(true)}
            >
              <Icon name="book" size={18} />
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
            follow.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 90;
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
                <NoataLogo size={64} />
              </div>
              <h1>
                {signedIn === false
                  ? "أهلًا بيك في Noata AI"
                  : "إزاي أقدر أساعدك النهارده؟"}
              </h1>
              <p>
                اسأل، ارفع صورة، التقط شاشة، أو اتكلم بصوتك. Noata يساعدك في
                الشرح والكتابة، مع اختيار نموذج مهيّأ يناسب السؤال. توفّر
                القدرات يعتمد على الخدمة.
              </p>
              <div className="owui-suggestions">
                {[
                  [
                    "book",
                    "اشرحلي مفهوم صعب",
                    "اشرحلي مفهوم صعب بطريقة بسيطة وبعدها اختبر فهمي.",
                  ],
                  [
                    "target",
                    "اختبر فهمي",
                    "اسألني 3 أسئلة متدرجة عن موضوع هقولهولك.",
                  ],
                  [
                    "image",
                    "حلّل صورة",
                    "هرفع صورة، ساعدني أفهم كل اللي فيها خطوة بخطوة.",
                  ],
                  [
                    "edit",
                    "رتّب مذاكرتي",
                    "ساعدني أعمل خطة مذاكرة واقعية ومنظمة.",
                  ],
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
              <button
                type="button"
                className="aura-education-entry"
                onClick={() => setEducationOpen(true)}
              >
                <Icon name="book" size={19} /> افتح ورشة المذاكرة: شرح،
                اختبارات، ملخصات، وبطاقات مراجعة
              </button>
              <button
                type="button"
                className="aura-writing-entry"
                onClick={() =>
                  setStudioSource(
                    input.trim() || "# مستند جديد\n\nابدأ كتابة أفكارك هنا.",
                  )
                }
              >
                <Icon name="edit" size={18} /> مساحة الكتابة · حرّر، راجع، وصدّر
                مستندك
              </button>
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
                    {m.role === "assistant" ? <NoataLogo size={30} /> : "أنت"}
                  </div>
                  <div className="owui-message-body">
                    <div className="owui-message-meta">
                      <strong>
                        {m.role === "assistant" ? "Noata AI" : "أنت"}
                      </strong>
                      {m.role === "assistant" && m.model && (
                        <span>{m.model}</span>
                      )}
                    </div>
                    {m.role === "assistant" && m.status !== "complete" && (
                      <p className="owui-stream-badge">
                        {m.status === "stopped"
                          ? "تم إيقاف الرد · محفوظ جزئيًا"
                          : "رد غير مكتمل · محفوظ جزئيًا"}
                      </p>
                    )}
                    <RichMessage content={m.content} />
                    {m.role === "assistant" &&
                      m.status === "complete" &&
                      (/^#{1,3}\s/m.test(m.content) ||
                        m.content.length > 1500) && (
                        <button
                          type="button"
                          className="aura-writing-artifact"
                          onClick={() => setStudioSource(m.content, m.id)}
                        >
                          <span className="aura-artifact-icon">
                            <Icon name="book" size={23} />
                          </span>
                          <span>
                            <strong>
                              {m.content
                                .match(/^#{1,3}\s+(.+)$/m)?.[1]
                                ?.slice(0, 80) || "مسودة من هذه الإجابة"}
                            </strong>
                            <small>حرّر النص · تنزيل Word وPDF وMarkdown</small>
                          </span>
                          <Icon name="arrow" size={17} />
                        </button>
                      )}
                    {m.role === "user" && (
                      <>
                        <AttachmentMessage metadata={m.metadata} />
                        <DocumentSourcesMessage
                          sources={m.metadata?.documentSources}
                        />
                      </>
                    )}
                    <div className="owui-message-actions">
                      <button
                        type="button"
                        onClick={() => void copy(m.content)}
                        title="نسخ"
                        aria-label="نسخ الرسالة"
                      >
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
                            onClick={() => setStudioSource(m.content, m.id)}
                            title="تحرير الرد في مساحة الكتابة"
                            aria-label="فتح الرد في مساحة الكتابة"
                          >
                            <Icon name="edit" size={14} />
                          </button>
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
                                onClick={() =>
                                  void send(undefined, "regenerate")
                                }
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
                        <button type="button" onClick={stopVoice}>
                          إلغاء
                        </button>
                      </p>
                    )}
                    {audioPlayback?.messageId === m.id && (
                      <ResponseAudioPlayer
                        key={audioPlayback.url}
                        url={audioPlayback.url}
                        audioRef={audioElement}
                        onClose={stopVoice}
                        onError={() => {
                          stopVoice();
                          setNotice("تعذّر تشغيل الصوت. جرّب توليده مرة أخرى.");
                        }}
                      />
                    )}
                  </div>
                </article>
              ))}

            {pendingText && (
              <article className="owui-message assistant streaming">
                <div className="owui-message-avatar" aria-hidden="true">
                  <NoataLogo size={30} />
                </div>
                <div className="owui-message-body">
                  <div className="owui-message-meta">
                    <strong>Noata AI</strong>
                    <span className="owui-stream-badge">
                      {busy ? "يكتب…" : "رد غير مكتمل"}
                    </span>
                  </div>
                  <RichMessage content={pendingText} />
                  {!busy && (
                    <div className="owui-message-actions">
                      <button
                        type="button"
                        onClick={() => void copy(pendingText)}
                      >
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
                <div className="owui-message-avatar" aria-hidden="true">
                  <NoataLogo size={30} />
                </div>
                <span />
                <span />
                <span />
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
                {(messages.at(-1)?.role === "user" ||
                  ["failed", "stopped"].includes(
                    messages.at(-1)?.status ?? "",
                  )) &&
                  !busy && (
                    <button
                      type="button"
                      onClick={() => void send(undefined, "retry")}
                    >
                      إعادة المحاولة
                    </button>
                  )}
              </div>
            )}
          </div>
        </div>

        <footer className="owui-composer-wrap">
          <form onSubmit={(e) => void send(e)} className="owui-composer">
            {documentFiles.length > 0 && (
              <div
                className="aura-document-tray"
                role="group"
                aria-label="ملفات المستندات المختارة"
              >
                {documentFiles.map((file, index) => (
                  <div className="aura-document-chip" key={index}>
                    <Icon name="book" size={16} />
                    <button
                      className="aura-pending-preview"
                      type="button"
                      title={file.name}
                      aria-label={"معاينة " + file.name}
                      onClick={() =>
                        setPendingPreview({
                          name: file.name,
                          localId: stageOriginalDocument(file),
                          format: file.name.toLowerCase().endsWith(".pdf")
                            ? "pdf"
                            : file.name.toLowerCase().endsWith(".docx")
                              ? "docx"
                              : "text",
                        })
                      }
                    >
                      {file.name}
                    </button>
                    <small>
                      {Math.max(1, Math.round(file.size / 1024))} KB
                    </small>
                    <button
                      type="button"
                      onClick={() =>
                        setDocumentFiles((old) =>
                          old.filter((_, i) => i !== index),
                        )
                      }
                      aria-label={"إزالة " + file.name}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))}
                <small>
                  تُقرأ الملفات محليًا؛ تُرسل مقاطع مناسبة لسؤالك. حفظ الأصل
                  يتطلب تفعيل التخزين الخاص؛ الوضع المؤقت لا يحفظه.
                </small>
              </div>
            )}
            {attachment && (
              <div className="owui-attachment">
                {preview ? (
                  <img src={preview} alt="معاينة المرفق" />
                ) : (
                  <div className="owui-file-icon">
                    <Icon name="chat" />
                  </div>
                )}
                <div>
                  <strong>{attachment.name}</strong>
                  <small>
                    {Math.max(1, Math.round(attachment.size / 1024))} KB
                  </small>
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
                <time>
                  {Math.floor(elapsed / 60)}:
                  {String(elapsed % 60).padStart(2, "0")}
                </time>
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
              disabled={busy || loading}
              onChange={(e) => { setHasTypedDraft(true); setInput(e.target.value); }}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData.files);
                if (files.length) {
                  e.preventDefault();
                  selectFiles(files);
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
              placeholder="ابعت رسالة لـ Noata AI"
              rows={1}
            />

            <input
              ref={picker}
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/png,image/webp,audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav,.txt,.md,.markdown,.csv,.json,.docx,.pdf,text/plain,text/markdown,text/csv,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
              onChange={(e) => {
                selectFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />

            <div className="owui-composer-toolbar">
              <div className="owui-composer-left">
                <div className="owui-input-menu-wrap">
                  <button
                    className="owui-round"
                    type="button"
                    disabled={busy || recording || loading}
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
                        <span>
                          <strong>رفع صورة أو مستند</strong>
                          <small>
                            صورة، صوت أو ملف نصي (TXT / MD / CSV / JSON / DOCX /
                            PDF)
                          </small>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void captureScreen();
                          setInputMenuOpen(false);
                        }}
                      >
                        <Icon name="screen" size={17} />
                        <span>
                          <strong>التقط الشاشة</strong>
                          <small>شارك شاشة واختر لقطة للمحادثة</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowTools(true);
                          setInputMenuOpen(false);
                        }}
                      >
                        <Icon name="sparkles" size={17} />
                        <span>
                          <strong>أدوات Fanar</strong>
                          <small>صورة، ترجمة، شعر، بحث وتحقق</small>
                        </span>
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
                {input.trim() && (
                  <span className="owui-char-count">
                    {input.length.toLocaleString("ar-EG")}
                  </span>
                )}
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
                    disabled={
                      (!input.trim() && !attachment && !documentFiles.length) ||
                      recording || loading
                    }
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
                  <button
                    type="button"
                    className="owui-icon"
                    onClick={() => setShowTools(false)}
                  >
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
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={busy}
            >
              <option value="auto">تلقائي · Noata تختار الأفضل</option>
              {FANAR_CAPABILITIES.filter((c) => c.visibleInPicker).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>تحويل الصوت إلى نص</span>
            <select
              value={sttModel}
              onChange={(e) => setSttModel(e.target.value)}
            >
              <option value="Fanar-Aura-STT-1">Aura STT</option>
              <option value="Fanar-Aura-STT-LF-1">Aura STT · Long Form</option>
            </select>
          </label>
          <label>
            <span>قراءة الردود</span>
            <select
              value={ttsModel}
              onChange={(e) => setTtsModel(e.target.value)}
            >
              <option value="Fanar-Aura-TTS-2">Aura TTS</option>
              <option value="Fanar-Sadiq-TTS-1">Sadiq · Quran TTS</option>
            </select>
          </label>
          <button
            type="button"
            className={"owui-setting-switch " + (temporary ? "active" : "")}
            onClick={historyProps.onTemporary}
          >
            <span>
              <strong>محادثة مؤقتة</strong>
              <small>لا تضيف المحادثة الحالية إلى السجل</small>
            </span>
            <i>{temporary ? "ON" : "OFF"}</i>
          </button>
        </div>
        <div className="owui-dialog-actions">
          <button
            type="button"
            className="owui-primary-action"
            onClick={() => setControlsOpen(false)}
          >
            تم
          </button>
          <button
            type="button"
            onClick={() => {
              setControlsOpen(false);
              setSettingsOpen(true);
            }}
          >
            كل الإعدادات
          </button>
        </div>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="إعدادات Noata AI"
      >
        <div className="owui-settings">
          <nav className="owui-settings-tabs" aria-label="أقسام الإعدادات">
            {(
              [
                ["general", "عام", "sliders"],
                ["models", "النماذج", "ai"],
                ["voice", "الصوت", "mic"],
                ["privacy", "الخصوصية", "archive"],
              ] as const
            ).map(([id, label, icon]) => (
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
                <button
                  type="button"
                  className={
                    "owui-setting-switch " + (temporary ? "active" : "")
                  }
                  onClick={historyProps.onTemporary}
                >
                  <span>
                    <strong>الوضع المؤقت</strong>
                    <small>المحادثات الجديدة لا تُضاف إلى السجل</small>
                  </span>
                  <i>{temporary ? "ON" : "OFF"}</i>
                </button>
                <button
                  type="button"
                  className="owui-setting-switch"
                  onClick={() => setShortcutsOpen(true)}
                >
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
                <p>
                  اختار قدرة محددة أو سيب Noata تختار تلقائيًا حسب سؤالك
                  والمرفقات.
                </p>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="auto">تلقائي · الأنسب لسؤالك</option>
                  {FANAR_CAPABILITIES.filter((c) => c.visibleInPicker).map(
                    (c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} · {c.quota}
                      </option>
                    ),
                  )}
                </select>
                <div className="owui-capability-list">
                  {FANAR_CAPABILITIES.map((c) => (
                    <div key={c.id}>
                      <span className={"owui-model-dot " + c.category} />
                      <span>
                        <strong>{c.label}</strong>
                        <small>
                          {c.use} · {c.quota}
                        </small>
                      </span>
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
                  <select
                    value={sttModel}
                    onChange={(e) => setSttModel(e.target.value)}
                  >
                    <option value="Fanar-Aura-STT-1">Fanar Aura STT</option>
                    <option value="Fanar-Aura-STT-LF-1">
                      Fanar Aura STT Long Form
                    </option>
                  </select>
                </label>
                <label>
                  <span>Text to Speech</span>
                  <select
                    value={ttsModel}
                    onChange={(e) => setTtsModel(e.target.value)}
                  >
                    <option value="Fanar-Aura-TTS-2">Fanar Aura TTS 2</option>
                    <option value="Fanar-Sadiq-TTS-1">
                      Fanar Sadiq Quran TTS
                    </option>
                  </select>
                </label>
                <p>
                  الميكروفون لا يبدأ إلا بإذن المتصفح. التسجيل يُحوّل إلى نص قبل
                  الإرسال حتى تراجعه.
                </p>
              </>
            )}

            {settingsTab === "privacy" && (
              <>
                <h3>الخصوصية والبيانات</h3>
                <p>
                  سجل المحادثات والملفات مرتبط بحسابك ومحمي بسياسات Supabase.
                  مفاتيح Fanar لا تصل إلى المتصفح.
                </p>
                <div className="owui-privacy-links">
                  <Link href="/privacy">سياسة الخصوصية</Link>
                  <Link href="/terms">الشروط</Link>
                </div>
                <h3>تصدير المحادثة الحالية</h3>
                <div className="owui-export-actions">
                  <button
                    type="button"
                    disabled={!messages.length}
                    onClick={() => exportConversation("markdown")}
                  >
                    Markdown
                  </button>
                  <button
                    type="button"
                    disabled={!messages.length}
                    onClick={() => exportConversation("json")}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    disabled={!messages.length}
                    onClick={() => exportConversation("docx")}
                  >
                    Word DOCX
                  </button>
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
          <button type="button" onClick={() => setSettingsOpen(false)}>
            إلغاء
          </button>
        </div>
      </Dialog>

      <Dialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title="اختصارات Noata AI"
      >
        <div className="owui-shortcuts">
          <div>
            <span>محادثة جديدة</span>
            <kbd>Ctrl</kbd>
            <kbd>Shift</kbd>
            <kbd>O</kbd>
          </div>
          <div>
            <span>التركيز على مربع الرسالة</span>
            <kbd>Ctrl</kbd>
            <kbd>K</kbd>
          </div>
          <div>
            <span>فتح الإعدادات</span>
            <kbd>Ctrl</kbd>
            <kbd>,</kbd>
          </div>
          <div>
            <span>إرسال الرسالة</span>
            <kbd>Enter</kbd>
          </div>
          <div>
            <span>سطر جديد</span>
            <kbd>Shift</kbd>
            <kbd>Enter</kbd>
          </div>
          <div>
            <span>إغلاق القوائم</span>
            <kbd>Esc</kbd>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={pendingPreview !== null}
        onClose={() => setPendingPreview(null)}
        title={pendingPreview?.name ?? "معاينة المرفق"}
      >
        {pendingPreview && <OriginalDocumentPreview source={pendingPreview} />}
      </Dialog>
      <Dialog
        open={educationOpen}
        onClose={() => setEducationOpen(false)}
        title="ورشة المذاكرة · Noata Aura"
        variant="workshop"
      >
        <EducationPanel
          canSend={Boolean(signedIn) && !busy && !loading && !attachment && documentFiles.length === 0}
          onUse={(prompt) => {
            setInput(prompt);
            setEducationOpen(false);
            window.setTimeout(() => composer.current?.focus(), 0);
          }}
          onSend={(prompt) => {
            setEducationOpen(false);
            // Send the exact workshop prompt, independent of React state timing.
            void send(undefined, "send", undefined, prompt);
          }}
        />
      </Dialog>
      <WritingStudio
        key={workspace.sessionVersion}
        open={studio !== null && studio.session === workspace.sessionVersion}
        source={
          studio?.session === workspace.sessionVersion ? studio.source : ""
        }
        draftKey={studio?.key ?? "composer"}
        onClose={() => setStudioSource(null)}
      />
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
          <p>
            سيتم حذف المحادثة ورسائلها من حسابك نهائيًا. لا يمكن التراجع عن
            الحذف.
          </p>
        ) : (
          <>
            {dialog?.kind === "edit" && (
              <p>
                سيتم حذف هذه الرسالة والردود التي بعدها، وبعدها تقدر تبعت النسخة
                المعدلة.
              </p>
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
          <button type="button" disabled={busy} onClick={() => setDialog(null)}>
            إلغاء
          </button>
        </div>
      </Dialog>
    </section>
  );
}
