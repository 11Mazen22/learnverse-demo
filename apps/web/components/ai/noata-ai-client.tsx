"use client";
import {useLocale,useTranslation} from "@/lib/i18n/locale";
/*
 * Noata AI full workspace.
 * UX structure and interaction patterns are adapted from Open WebUI v0.6.5
 * (Sidebar, Navbar/ModelSelector, Messages, MessageInput, Controls/Settings)
 * under BSD-3-Clause. This is a React/Next.js port integrated with Noata's
 * Supabase persistence, authentication and Fanar backend.
 * See docs/THIRD_PARTY_NOTICES.md.
 */
import { NoataLogo } from "@/components/ui/noata-logo";
import {answerModelLabel} from "@/lib/ai/answer-model";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { FANAR_CAPABILITIES } from "@/lib/ai/catalog";
import {
  CHAT_MODEL_CARDS,
  getChatModelCards,
  resolveSuggestedModel,
} from "@/lib/ai/model-routing";

import { downloadNoataDocx } from "@/lib/ai/docx-export";
import { AttachmentMessage } from "./attachment-message";
import { DocumentSourcesMessage } from "./document-sources-message";
import { NoataCreativeStudio } from "./creative-studio";
import { stageOriginalDocument } from "@/lib/ai/original-documents";
import { ResponseAudioPlayer } from "./response-audio-player";
import { useUnsavedWork } from "@/lib/use-unsaved-work";
import { WritingStudio } from "./writing-studio";
import {ResearchSources} from "./response-components";
import {responseText} from "../../../../supabase/functions/noata-ai/response-ui.ts";
import { EducationPanel } from "./education-panel";
import { Icon } from "@/components/ui/icon";
import { Dialog } from "@/components/ui/dialog";
import { ThemeControl } from "@/components/preferences/theme-control";
import { ConversationHistory } from "./conversation-history";
import { RichMessage } from "./rich-message";
import { useAIWorkspace } from "./use-ai-workspace";
import {useAISuggestions,SuggestedActions} from "./use-ai-suggestions";
import {NoataMotionControl} from "./motion-control";
import {NoataMemorySettings} from "./memory-settings";
import {NoataProjectLibrary} from "./project-library";

import {NoataCapabilityCenter} from "./noata-capability-center";
import styles from "./noata-one.module.css";
import {NoataWelcome} from "./noata-welcome";
import {useNoataMotionPreference} from "./motion-control";
import {NoataGeneratedArtifact} from "./generated-artifact";

import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { AI_INTRO_VERSION, markFeatureSeen } from "@/lib/feature-seen";

type SettingsTab = "general" | "appearance" | "models" | "voice" | "memory" | "projects" | "capabilities" | "privacy";

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
  const t=useTranslation(),locale=useLocale();
  useNoataMotionPreference();
  const CHAT_MODEL_CARDS=getChatModelCards(locale);
  const seenAccount = useVerifiedAccount();
  useEffect(() => {
    if (!seenAccount.loading) markFeatureSeen("ai", AI_INTRO_VERSION, seenAccount.user?.id ?? null);
  }, [seenAccount.loading, seenAccount.user?.id]);
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
    input,
    recording,
    elapsed,
    cancelRecording,
    media,
    picker,
    toggleRecording,
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
  const modelPickerRef = useRef<HTMLDivElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!modelMenuOpen) return;
    const onOutsidePress = (event: PointerEvent) => {
      if (event.target instanceof Node && !modelPickerRef.current?.contains(event.target))
        setModelMenuOpen(false);
    };
    document.addEventListener("pointerdown", onOutsidePress);
    return () => document.removeEventListener("pointerdown", onOutsidePress);
  }, [modelMenuOpen]);
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
    format: "pdf" | "docx" | "xlsx" | "pptx" | "text";
  } | null>(null);

  const suggestions=useAISuggestions({userId:seenAccount.user?.id??null,locale,
    welcomeVisible:!loading&&!messages.length&&!activeId,
    welcomeEpoch:workspace.newChatEpoch,conversations,messages,busy,temporary});
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
        if (modelMenuOpen) modelTriggerRef.current?.focus();
        setModelMenuOpen(false);
        setControlsOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [composer, newChat, modelMenuOpen]);

  function exportConversation(format: "markdown" | "json" | "docx") {
    const stamp = new Date().toISOString().slice(0, 10);
    const title = (activeConversation?.title || "noata-ai-chat").replace(
      /[\\/:*?"<>|]/g,
      "-",
    );
    if (format === "docx") {
      const body =
        "# " +
        (activeConversation?.title ?? t("محادثة Noata AI","Noata AI conversation")) +
        "\n\n" +
        messages
          .filter((m) => m.role !== "system")
          .map(
            (m) =>
              (m.role === "user" ? t("## أنت","## You") : "## Noata AI") + "\n" + (m.role === "assistant" ? responseText(m.content) : m.content),
          )
          .join("\n\n");
      if (body.length > 200000) {
        setNotice(t("المحادثة طويلة جدًا لملف واحد. صدّرها بصيغة Markdown.","This conversation is too long for one document. Export it as Markdown."));
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
            (m.role === "user" ? t("## أنت\n\n","## You\n\n") : "## Noata AI\n\n") + (m.role === "assistant" ? responseText(m.content) : m.content),
        )
        .join("\n\n---\n\n");
      downloadText(
        title + "-" + stamp + ".md",
        "# " + (activeConversation?.title ?? "Noata AI") + "\n\n" + body,
        "text/markdown",
      );
    }
    setNotice(t("تم تصدير المحادثة.","Conversation exported."));
  }


  const sidebar = (
    <ConversationHistory
      {...historyProps}
      collapsed={sidebarCollapsed}
      onToggleCollapse={() => setSidebarCollapsed((x) => !x)}
      onOpenSettings={() => setSettingsOpen(true)}
      onOpenLibrary={() => {setSettingsTab("projects");setSettingsOpen(true);}}
      onOpenShortcuts={() => setShortcutsOpen(true)}
    />
  );

  return (
    <section
      dir={locale==="en"?"ltr":"rtl"}
      lang={locale}
      className={`${styles.root} owui-layout ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      data-empty={!messages.length && !loading ? "true" : "false"}
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
            <strong>{t("ارفع مستنداتك أو صورتك","Drop your documents or image")}</strong>
            <span>{t("حتى ٤ ملفات TXT أو DOCX وملف صورة واحد — الملفات غير المدعومة تظهر رسالة توضيحية","Up to 4 TXT or DOCX files and one image. Unsupported files show an explanation.")}</span>
          </div>
        )}

        <header className="owui-navbar">
          <div className="owui-navbar-start">
            <button
              type="button"
              className="owui-icon mobile-sidebar-trigger"
              onClick={() => setMobileHistory(true)}
              aria-label={t("فتح سجل المحادثات","Open conversation history")}
            >
              <Icon name="menu" />
            </button>
            <div className="owui-model-picker" ref={modelPickerRef}>
              <button
                type="button"
                className="owui-model-trigger"
                ref={modelTriggerRef}
                onClick={() => setModelMenuOpen((x) => !x)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setModelMenuOpen(true);
                    requestAnimationFrame(() => modelPickerRef.current?.querySelector<HTMLButtonElement>(".aura-model-card")?.focus());
                  }
                }}
                aria-label={t("اختيار نموذج الذكاء الاصطناعي","Choose AI model")}
                aria-controls={modelMenuOpen ? "noata-ai-model-options" : undefined}
                aria-expanded={modelMenuOpen}
              >
                <span>
                  <small>{t("النموذج","Model")}</small>
                  <strong>
                    {model === "auto"
                      ? t("تلقائي · الأنسب لسؤالك","Auto · matched to your request")
                      : (CHAT_MODEL_CARDS.find((c) => c.id === model)?.arabic ??
                        model)}
                  </strong>
                </span>
                <Icon name="chevron" size={15} />
              </button>
              {modelMenuOpen && (
                <div
                  className="owui-model-menu aura-model-gallery"
                  id="noata-ai-model-options"
                  role="group"
                  aria-label={t("النماذج المهيأة على خادم Noata","Models configured for Noata")}
                >
                  <div className="aura-model-gallery-head">
                    <div className="aura-model-gallery-heading">
                      <strong>{t("اختار مساعدك","Choose your assistant")}</strong>
                      <span>{t("فنار · النماذج المهيأة بالخادم","Fanar · available model routes")}</span>
                    </div>
                    <button type="button" className="aura-model-gallery-dismiss"
                      aria-label={t("إغلاق قائمة النماذج","Close model selector")}
                      onClick={() => { setModelMenuOpen(false); modelTriggerRef.current?.focus(); }}>
                      <Icon name="close" size={17} />
                    </button>
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
                      <strong>{t("تلقائي · Aura Smart","Auto · Aura Smart")}</strong>
                      <small>{t("اختيار مبني على نوع السؤال، وليس نموذجًا ثابتًا","Selects a model for the task and attachments")}</small>
                      <span className="aura-model-features">
                        {input.trim()
                          ? t("المقترح لهذا السؤال: ","Suggested for this request: ") +
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
                            )?.arabic ?? t("فنار","Fanar"))
                          : t("محادثة · منطق · أسئلة إسلامية · رؤية","Chat · reasoning · Islamic questions · vision")}
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
                    <small>{t("مهيّأ على Edge Function، والتوفر الفعلي يتضح عند إرسال الطلب. لا يوجد اختبار صحة مباشر لكل نموذج هنا.","A model's availability is confirmed when your request reaches the provider.")}</small>
                    <button
                      type="button"
                      onClick={() => {
                        setSettingsOpen(true);
                        setModelMenuOpen(false);
                      }}
                    >
                      <Icon name="settings" size={14} />{t("الإعدادات","Settings")}</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="owui-navbar-center">
            {temporary ? (
              <span className="owui-status-pill temporary">
                <Icon name="clock" size={13} />{t("مؤقتة","Temporary")}</span>
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
            <details className="noata-one-actions" onKeyDown={e=>{if(e.key==="Escape"){e.currentTarget.removeAttribute("open");e.currentTarget.querySelector("summary")?.focus();}}}>
              <summary aria-label={t("خيارات المحادثة","Conversation options")}><Icon name="dots" size={19}/></summary>
              <div className="noata-one-actions-menu" onClick={e=>{if((e.target as HTMLElement).closest("button"))e.currentTarget.closest("details")?.removeAttribute("open");}}>
                <button type="button" onClick={()=>setControlsOpen(true)}><Icon name="sliders" size={16}/>{t("عناصر التحكم","Controls")}</button>
                {messages.length>0&&<button type="button" onClick={()=>exportConversation("markdown")}><Icon name="download" size={16}/>{t("تصدير المحادثة","Export conversation")}</button>}
                <button type="button" disabled={busy} onClick={()=>newChat()}><Icon name="edit" size={16}/>{t("محادثة جديدة","New conversation")}</button>
                <button type="button" aria-label={t("افتح ورشة المذاكرة","Open study workshop")} onClick={()=>setEducationOpen(true)}><Icon name="book" size={16}/>{t("ورشة المذاكرة","Study workshop")}</button>
              </div>
            </details>
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
              <p>{t("بنجهّز مساحة Noata AI…","Preparing Noata AI…")}</p>
            </div>
          )}

          {!messages.length && !loading && (
            <div><NoataWelcome signedIn={signedIn} />{error&&<p className="owui-error" role="alert">{error}</p>}</div>
          )}

          <div className="owui-thread">
            {messages
              .filter((m) => m.role !== "system")
              .map((m, index) => (
                <article key={m.id} className={"owui-message " + m.role}>
                  <div className="owui-message-avatar" aria-hidden="true">
                    {m.role === "assistant" ? <NoataLogo size={30} /> : <Icon name="user" size={17}/>}
                  </div>
                  <div className="owui-message-body">
                    <div className="owui-message-meta">
                      <strong>
                        {m.role === "assistant" ? "Noata AI" : t("أنت","You")}
                      </strong>
                      {m.role === "assistant" && answerModelLabel(m.model,locale) && (
                        <details className="noata-model-disclosure">
                          <summary aria-label={t("نموذج الإجابة: ","Answer model: ")+answerModelLabel(m.model,locale)}><span>{answerModelLabel(m.model,locale)}</span><Icon name="chevron" size={12}/></summary>
                          <small>{m.model}</small>
                        </details>
                      )}
                    </div>
                    {m.role === "assistant" && m.status !== "complete" && (
                      <p className="owui-stream-badge">
                        {m.status === "stopped"
                          ? t("تم إيقاف الرد · محفوظ جزئيًا","Stopped · partial response saved")
                          : t("رد غير مكتمل · محفوظ جزئيًا","Incomplete · partial response saved")}
                      </p>
                    )}
                    <RichMessage content={m.content} research={m.metadata?.research}/>
                    {m.role==="assistant"&&m.status==="complete"&&
                      (Array.isArray(m.metadata?.generatedArtifacts)?m.metadata.generatedArtifacts.slice(0,4):[m.metadata?.generatedArtifact]).map((artifact,index)=>
                      <NoataGeneratedArtifact key={m.id+"-file-"+index} value={artifact}
                        owner={seenAccount.user?.id??null}
                        onPrepareEdit={(prompt,source)=>{workspace.prepareRevision(prompt,source);setNotice(t("طلب التعديل في مربع الرسالة. راجعه ثم أرسله.","The revision request is in your composer. Review it, then send."));composer.current?.focus();}}
                        onAskAI={prompt=>{if(!busy)void send(undefined,"send",undefined,prompt);}}/>)}


                    {m.role==="assistant"&&<ResearchSources research={m.metadata?.research}/>}
                    {(m.metadata?.routeNote==="sadiq_2_unavailable_sadiq_1"||m.metadata?.routeNote==="sadiq_unavailable_general_model")&&<p className="noata-widget-note">{m.metadata?.routeNote==="sadiq_2_unavailable_sadiq_1"?t("صادق 2 غير مفعّل؛ هذا الرد من صادق.","Sadiq 2 is not enabled; this answer used Sadiq."):t("صادق 2 غير مفعّل؛ هذا الرد من النموذج العام.","Sadiq 2 is not enabled; this answer used the general model.")}</p>}
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
                        onClick={() => void copy(m.role === "assistant" ? responseText(m.content) : m.content)}
                        title={t("نسخ","Copy")}
                        aria-label={t("نسخ الرسالة","Copy message")}
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
                          title={t("تعديل","Edit")}
                          aria-label={t("تعديل الرسالة","Edit message")}
                        >
                          <Icon name="edit" size={14} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            data-testid="noata-edit-answer"
                            onClick={() => setStudioSource(responseText(m.content), m.id)}
                            title={t("تحرير النص","Edit text")}
                            aria-label={t("تحرير نص الرد","Edit answer text")}
                          >
                            <Icon name="edit" size={14} />
                          </button>

                          <button
                            type="button"
                            disabled={voiceBusy}
                            onClick={() => void readAloud(responseText(m.content), m.id)}
                            title={t("استماع","Listen")}
                            aria-label={t("الاستماع للرد","Listen to answer")}
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
                                title={t("إعادة توليد الرد","Regenerate answer")}
                              >
                                <Icon name="review" size={14} />
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void send(undefined, "continue")}
                                title={t("كمّل الرد","Continue answer")}
                              >
                                <Icon name="arrow" size={14} />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                    {voiceBusy && voiceRequestMessageId === m.id && (
                      <p className="owui-voice-pending" role="status">{t("بنجهّز التسجيل الصوتي لهذا الرد…","Preparing audio for this answer…")}<button type="button" onClick={stopVoice}>{t("إلغاء","Cancel")}</button>
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
                          setNotice(t("تعذّر تشغيل الصوت. جرّب توليده مرة أخرى.","Could not play the audio. Try generating it again."));
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
                      {busy ? t("يكتب…","Writing…") : t("رد غير مكتمل","Incomplete response")}
                    </span>
                  </div>
                  <RichMessage content={pendingText} streaming/>
                  {!busy && (
                    <div className="owui-message-actions">
                      <button
                        type="button"
                        onClick={() => void copy(pendingText)}
                      >
                        <Icon name="copy" size={14} />{t("نسخ","Copy")}</button>
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
                <em>{notice || t("Noata بتفكر…","Noata is working…")}</em>
              </div>
            )}

            {error && (
              <div className="owui-error" role="alert">
                <Icon name="help" />
                <div>
                  <strong>{t("مقدرناش نكمل الطلب","Could not complete your request")}</strong>
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
                    >{t("إعادة المحاولة","Try again")}</button>
                  )}
              </div>
            )}
            {!busy && !loading && !error && messages.at(-1)?.role==="assistant" &&
             messages.at(-1)?.status==="complete" && (
              <SuggestedActions kind="followup" locale={locale} items={suggestions.followups}
                disabled={busy} onChoose={prompt=>void send(undefined,"send",undefined,prompt)} />
            )}
          </div>
        </div>

        <footer className="owui-composer-wrap">
          <form onSubmit={(e) => void send(e)} className="owui-composer">
            {workspace.revisionName&&<div className="noata-revision-context" role="status"><Icon name="file" size={16}/><span>{t("تعديل نسخة من: ","Revising: ")}{workspace.revisionName}</span><button type="button" aria-label={t("إزالة مصدر التعديل","Clear revision source")} onClick={workspace.clearRevision}><Icon name="close" size={15}/></button></div>}
            {documentFiles.length > 0 && (
              <div
                className="aura-document-tray"
                role="group"
                aria-label={t("ملفات المستندات المختارة","Selected documents")}
              >
                {documentFiles.map((file, index) => (
                  <div className="aura-document-chip" key={index}>
                    <Icon name="book" size={16} />
                    <button
                      className="aura-pending-preview"
                      type="button"
                      title={file.name}
                      aria-label={t("معاينة ","Preview ") + file.name}
                      onClick={() =>
                        setPendingPreview({
                          name: file.name,
                          localId: stageOriginalDocument(file),
                          format: file.name.toLowerCase().endsWith(".pdf")
                            ? "pdf"
                            : file.name.toLowerCase().endsWith(".docx")
                              ? "docx"
                              : file.name.toLowerCase().endsWith(".xlsx")
                                ? "xlsx"
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
                      aria-label={t("إزالة ","Remove ") + file.name}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </div>
                ))}
                <small>{t("تُقرأ الملفات محليًا؛ تُرسل مقاطع مناسبة لسؤالك. حفظ الأصل يتطلب تفعيل التخزين الخاص؛ الوضع المؤقت لا يحفظه.","Files are read on your device. Relevant excerpts are sent with your question. Saving originals requires private storage; temporary mode does not save them.")}</small>
              </div>
            )}
            {attachment && (
              <div className="owui-attachment">
                {preview ? (
                  <img src={preview} alt={t("معاينة المرفق","Preview attachment")} />
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
                  aria-label={t("إزالة المرفق","Remove attachment")}
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            )}

            {recording && (
              <div className="owui-recording" role="status">
                <span className="owui-recording-dot" />
                <strong>{t("تسجيل","Recording")}</strong>
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
                >{t("إلغاء","Cancel")}</button>
              </div>
            )}

            <textarea
              ref={composer}
              aria-label={t("رسالتك إلى Noata AI","Your message to Noata AI")}
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
              placeholder={t("ابعت رسالة لـ Noata AI","Message Noata AI")}
              rows={1}
            />

            <input
              ref={picker}
              type="file"
              hidden
              multiple
              accept="image/jpeg,image/png,image/webp,audio/webm,audio/ogg,audio/mp4,audio/mpeg,audio/wav,.txt,.md,.markdown,.csv,.json,.docx,.pdf,.xlsx,.pptx,text/plain,text/markdown,text/csv,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf"
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
                    aria-label={t("إضافة مرفق أو أداة","Add an attachment or tool")}
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
                          <strong>{t("رفع صورة أو مستند","Upload an image or document")}</strong>
                          <small>{t("صورة، صوت أو ملف نصي (TXT / MD / CSV / JSON / DOCX / PDF / XLSX)","Image, audio, or document (TXT / MD / CSV / JSON / DOCX / PDF / XLSX)")}</small>
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
                          <strong>{t("التقط الشاشة","Capture screen")}</strong>
                          <small>{t("شارك شاشة واختر لقطة للمحادثة","Share a screen and choose a snapshot for this chat")}</small>
                        </span>
                      </button>
                      <button type="button" className="noata-start-document"
                        onClick={()=>{setStudioSource(t("# مستند جديد\n\nابدأ الكتابة هنا.","# New document\n\nStart your document here."),"new-document");setInputMenuOpen(false);}}>
                        <Icon name="book" size={17}/>
                        <span><strong>{t("اكتب مسودة","Write a draft")}</strong>
                        <small>{t("حرّر نصًا بنفسك في هذه المحادثة","Edit your own text in this conversation")}</small></span>
                      </button>
                    </div>
                  )}
                </div>


                <button
                  className="owui-round"
                  type="button"
                  disabled={busy}
                  aria-label={recording ? t("إنهاء التسجيل","Finish recording") : t("تسجيل رسالة صوتية","Record a voice message")}
                  onClick={() => void toggleRecording()}
                >
                  <Icon name={recording ? "stop" : "mic"} size={18} />
                </button>
              </div>

              <div className="owui-composer-right">
                {input.trim() && (
                  <span className="owui-char-count">
                    {input.length.toLocaleString(locale==="en"?"en":"ar-EG")}
                  </span>
                )}
                {busy ? (
                  <button
                    className="owui-send stop"
                    type="button"
                    onClick={() => abort.current?.abort()}
                    aria-label={t("إيقاف التوليد","Stop generating")}
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
                    aria-label={t("إرسال","Send")}
                  >
                    <Icon name="arrow" size={17} />
                  </button>
                )}
              </div>
            </div>

          </form>

          {!messages.length && !loading && <SuggestedActions kind="welcome" locale={locale} items={suggestions.welcome}
            disabled={busy||loading} onChoose={prompt=>{setInput(prompt);composer.current?.focus();}} />}
          <p className="owui-disclaimer">
            {temporary
              ? t("محادثة مؤقتة · لا تظهر في سجل المحادثات.","Temporary conversation · does not appear in your history.")
              : notice || t("Noata AI ممكن تخطئ. راجع المعلومات المهمة.","Noata AI can make mistakes. Check important information.")}
          </p>
        </footer>
      </section>

      <Dialog
        open={mobileHistory}
        onClose={() => setMobileHistory(false)}
        title={t("محادثاتك","Your conversations")}
      >
        <div className="owui-mobile-sidebar">
          <ConversationHistory
            {...historyProps}
            collapsed={false}
            onOpenSettings={() => {
              setMobileHistory(false);
              setSettingsOpen(true);
            }}
            onOpenLibrary={() => {setMobileHistory(false);setSettingsTab("projects");setSettingsOpen(true);}}
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
        title={t("عناصر تحكم Noata AI","Noata AI controls")}
      >
        <div className="owui-control-grid">
          <label>
            <span>{t("نموذج المحادثة","Chat model")}</span>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={busy}
            >
              <option value="auto">{t("تلقائي · Noata تختار الأفضل","Auto · Noata selects a model")}</option>
              {FANAR_CAPABILITIES.filter((c) => c.visibleInPicker).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t("تحويل الصوت إلى نص","Speech to text")}</span>
            <select
              value={sttModel}
              onChange={(e) => setSttModel(e.target.value)}
            >
              <option value="Fanar-Aura-STT-1">Aura STT</option>
              <option value="Fanar-Aura-STT-LF-1">Aura STT · Long Form</option>
            </select>
          </label>
          <label>
            <span>{t("قراءة الردود","Read answers aloud")}</span>
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
              <strong>{t("محادثة مؤقتة","Temporary conversation")}</strong>
              <small>{t("لا تضيف المحادثة الحالية إلى السجل","Keep this conversation out of history")}</small>
            </span>
            <i>{temporary ? "ON" : "OFF"}</i>
          </button>
        </div>
        <div className="owui-dialog-actions">
          <button
            type="button"
            className="owui-primary-action"
            onClick={() => setControlsOpen(false)}
          >{t("تم","Done")}</button>
          <button
            type="button"
            onClick={() => {
              setControlsOpen(false);
              setSettingsOpen(true);
            }}
          >{t("كل الإعدادات","All settings")}</button>
        </div>
      </Dialog>

      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t("إعدادات Noata AI","Noata AI settings")}
        variant="ai"
      >
        <div className="owui-settings">
          <nav className="owui-settings-tabs" aria-label={t("أقسام الإعدادات","Settings sections")}>
            {(
              [
                ["general", t("عام","General"), "sliders"],
                ["appearance", t("المظهر","Appearance"), "sparkles"],
                ["models", t("النماذج","Models"), "ai"],
                ["voice", t("الصوت","Voice"), "mic"],
                ["memory", t("الذاكرة","Memory"), "book"],
                ["projects", t("الملفات","Files"), "archive"],
                ["capabilities", t("الخدمات المتصلة","Connected services"), "sliders"],
                ["privacy", t("الخصوصية","Privacy"), "archive"],
              ] as const
            ).map(([id, label, icon]) => (
              <button
                key={id}
                type="button"
                className={settingsTab === id ? "active" : ""}
                aria-pressed={settingsTab === id}
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
                <h3>{t("سلوك المحادثة","Conversation behavior")}</h3>
                <button
                  type="button"
                  className={
                    "owui-setting-switch " + (temporary ? "active" : "")
                  }
                  onClick={historyProps.onTemporary}
                >
                  <span>
                    <strong>{t("الوضع المؤقت","Temporary mode")}</strong>
                    <small>{t("المحادثات الجديدة لا تُضاف إلى السجل","New conversations are not added to history")}</small>
                  </span>
                  <i>{temporary ? "ON" : "OFF"}</i>
                </button>
                <button
                  type="button"
                  className="owui-setting-switch"
                  onClick={() => setShortcutsOpen(true)}
                >
                  <span>
                    <strong>{t("اختصارات لوحة المفاتيح","Keyboard shortcuts")}</strong>
                    <small>{t("افتح قائمة الاختصارات المتاحة","View available keyboard shortcuts")}</small>
                  </span>
                  <Icon name="keyboard" size={18} />
                </button>
              </>
            )}

            {settingsTab === "appearance" && (
              <>
                <h3>{t("المظهر والحركة","Appearance and motion")}</h3>
                <p>{t("اختار ألوان Noata وحركة الواجهة. إعداد الحركة محفوظ على الجهاز.","Choose your Noata palette and animation level. Motion settings are saved on this device.")}</p>
                <ThemeControl />
                <NoataMotionControl />
              </>
            )}

            {settingsTab === "models" && (
              <>
                <h3>{t("النموذج الافتراضي","Default model")}</h3>
                <p>{t("اختار قدرة محددة أو سيب Noata تختار تلقائيًا حسب سؤالك والمرفقات.","Choose a model or let Noata select one for your request and attachments.")}</p>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="auto">{t("تلقائي · الأنسب لسؤالك","Auto · matched to your request")}</option>
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
                <h3>{t("الصوت","Voice")}</h3>
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
                <p>{t("الميكروفون لا يبدأ إلا بإذن المتصفح. التسجيل يُحوّل إلى نص قبل الإرسال حتى تراجعه.","Your microphone starts only with browser permission. Review the transcript before sending it.")}</p>
              </>
            )}

            {settingsTab === "memory" && (
              <NoataMemorySettings owner={seenAccount.user?.id??null} temporary={temporary} open={settingsOpen&&settingsTab==="memory"}/>
            )}

            {settingsTab === "projects" && (
              <NoataProjectLibrary owner={seenAccount.user?.id??null} open={settingsOpen&&settingsTab==="projects"} onPrepareEdit={(prompt,source)=>{workspace.prepareRevision(prompt,source);setSettingsOpen(false);setNotice(t("طلب التعديل جاهز للمراجعة والإرسال.","Your revision request is ready to review and send."));requestAnimationFrame(()=>composer.current?.focus());}} onUseUpload={file=>{selectFiles([file]);setSettingsOpen(false);}}/>
            )}

            {settingsTab === "capabilities" && (
              <NoataCapabilityCenter owner={seenAccount.user?.id??null}
                open={settingsOpen&&settingsTab==="capabilities"}/>
            )}

            {settingsTab === "privacy" && (
              <>
                <h3>{t("الخصوصية والبيانات","Privacy and data")}</h3>
                <button type="button" className="noata-personalize" aria-pressed={suggestions.personalized}
                  disabled={!seenAccount.user?.id||temporary} onClick={()=>suggestions.changePersonalized(!suggestions.personalized)}>
                  <span><b>{t("اقتراحات مخصّصة من محادثاتي السابقة","Personalize suggestions from recent chats")}</b>
                    <small>{t("اختياري ومغلق افتراضيًا. يستخدم عناوين آخر المحادثات فقط، ولا يقرأ نصوصها أو ملفاتها.","Opt-in and off by default. Uses recent conversation titles only, not message bodies or files.")}</small></span>
                  <i>{suggestions.personalized?t("مفعّل","On"):t("مغلق","Off")}</i>
                </button>
                <p>{t("سجل المحادثات والملفات مرتبط بحسابك ومحمي بسياسات Supabase. مفاتيح Fanar لا تصل إلى المتصفح.","Your conversation history and files belong to your account and are protected by access policies. Fanar keys are kept on the server.")}</p>
                <div className="owui-privacy-links">
                  <Link href="/privacy">{t("سياسة الخصوصية","Privacy policy")}</Link>
                  <Link href="/terms">{t("الشروط","Terms")}</Link>
                </div>
                <h3>{t("تصدير المحادثة الحالية","Export current conversation")}</h3>
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
          >{t("حفظ التفضيلات","Save preferences")}</button>
          <button type="button" onClick={() => setSettingsOpen(false)}>{t("إلغاء","Cancel")}</button>
        </div>
      </Dialog>

      <Dialog
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title={t("اختصارات Noata AI","Noata AI shortcuts")}
      >
        <div className="owui-shortcuts">
          <div>
            <span>{t("محادثة جديدة","New conversation")}</span>
            <kbd>Ctrl</kbd>
            <kbd>Shift</kbd>
            <kbd>O</kbd>
          </div>
          <div>
            <span>{t("التركيز على مربع الرسالة","Focus message composer")}</span>
            <kbd>Ctrl</kbd>
            <kbd>K</kbd>
          </div>
          <div>
            <span>{t("فتح الإعدادات","Open settings")}</span>
            <kbd>Ctrl</kbd>
            <kbd>,</kbd>
          </div>
          <div>
            <span>{t("إرسال الرسالة","Send message")}</span>
            <kbd>Enter</kbd>
          </div>
          <div>
            <span>{t("سطر جديد","New line")}</span>
            <kbd>Shift</kbd>
            <kbd>Enter</kbd>
          </div>
          <div>
            <span>{t("إغلاق القوائم","Close menus")}</span>
            <kbd>Esc</kbd>
          </div>
        </div>
      </Dialog>

      <NoataCreativeStudio
        file={null}
        localSource={pendingPreview}
        owner={seenAccount.user?.id??null}
        onClose={()=>setPendingPreview(null)}
        onPrepareEdit={(prompt,source)=>{workspace.prepareRevision(prompt,source);setPendingPreview(null);requestAnimationFrame(()=>composer.current?.focus());}}
      />
      <Dialog
        open={educationOpen}
        onClose={() => setEducationOpen(false)}
        title={t("ورشة المذاكرة · Noata Aura","Study workshop · Noata Aura")}
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
        owner={seenAccount.user?.id??null}
        onClose={() => setStudioSource(null)}
      />
      <Dialog
        open={Boolean(dialog)}
        onClose={() => {
          if (!busy) setDialog(null);
        }}
        title={
          dialog?.kind === "delete"
            ? t("حذف المحادثة؟","Delete this conversation?")
            : dialog?.kind === "edit"
              ? t("تعديل الرسالة","Edit message")
              : t("إعادة تسمية المحادثة","Rename conversation")
        }
      >
        {dialog?.kind === "delete" ? (
          <p>{t("سيتم حذف المحادثة ورسائلها من حسابك نهائيًا. لا يمكن التراجع عن الحذف.","This conversation and its messages will be permanently deleted from your account. This cannot be undone.")}</p>
        ) : (
          <>
            {dialog?.kind === "edit" && (
              <p>{t("سيتم حذف هذه الرسالة والردود التي بعدها، وبعدها تقدر تبعت النسخة المعدلة.","This message and the answers after it will be deleted so you can send the edited version.")}</p>
            )}
            <textarea
              className="owui-dialog-textarea"
              aria-label={t("النص الجديد","New text")}
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
            {dialog?.kind === "delete" ? t("حذف نهائي","Delete permanently") : t("تأكيد","Confirm")}
          </button>
          <button type="button" disabled={busy} onClick={() => setDialog(null)}>{t("إلغاء","Cancel")}</button>
        </div>
      </Dialog>
    </section>
  );
}
