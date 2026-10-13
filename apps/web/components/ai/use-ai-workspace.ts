"use client";
import {revisionMayLoseContent} from "@/lib/ai/revision-quality";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { toolOutputText } from "@/lib/ai/tool-output";
import { createVoiceGenerationGuard } from "@/lib/ai/voice-generation";
import {
  createSessionGuard,
  clearSessionWork,
  synchronizeSessionWork,
  composerDrafts,
} from "@/lib/ai/session-work";
import { isTextDocument, extractTextDocument } from "@/lib/ai/document-text";
import { isDocxDocument, extractDocxDocument } from "@/lib/ai/docx-ingest";
import {
  retainOriginalDocuments,
  deleteOriginalDocuments,
  clearOriginalDocuments,
} from "@/lib/ai/original-documents";
import { createAiMessageContext } from "@/lib/ai/context-budget";
import { continueChat, type ChatPart } from "@/lib/ai/continuation";
import { requestLanguage } from "../../../../supabase/functions/noata-ai/routing.ts";
import {validatedResearch,type Research} from "../../../../supabase/functions/noata-ai/research.ts";
import type {LibrarySource} from "@/lib/ai/library-source";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import {needsSemanticPlan,validateSemanticPlan} from "../../../../supabase/functions/noata-ai/semantic-plan.ts";
import type {ArtifactIntent} from "@/lib/ai/artifact-intent";
import type {CreatedArtifact} from "@/lib/ai/artifact-runner";
import { artifactContent,detectArtifactIntents,checkArtifactContent } from "@/lib/ai/artifact-intent";
import {planNoataRequest} from "@/lib/ai/capability-planner";
import {isNonDeliverableDraft,imageNeedsSubject} from "@/lib/ai/delivery-quality";
import {confirmedFileIntent} from "@/lib/ai/artifact-followup";
import { createConversationalArtifact, type ArtifactDriver } from "@/lib/ai/artifact-runner";
import { findActualLineChart } from "@/lib/ai/artifact-chart";
import {safeArtifactReplyOnCapabilityQuestion,directArtifactAbilityAnswer,canCreateArtifactFromAnswer,isArtifactRefusal} from "@/lib/ai/artifact-response-guard";
import { responseText } from "../../../../supabase/functions/noata-ai/response-ui.ts";
import {
  isSupportedDocument,
  validateDocumentBatch,
  extractDocumentBatch,
} from "@/lib/ai/multi-document";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, supabaseFetch } from "@/lib/supabase/config";
import {
  AI_FUNCTION,
  titleFrom,
  validateAttachment,
  parseStreamFrames,
  friendlyError,
  aiResponseFailure,
  safeStorageLink,
  type Conversation,
  type Message,
} from "@/lib/ai/workspace";
const columns =
  "id,conversation_id,role,content,model,status,created_at,metadata";
/** Never leave the AI workspace showing an endless loading screen when Auth is offline. */
async function sessionStep<T>(
  work: PromiseLike<T>,
  timeoutMs = 6500,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("AI session initialization timed out")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export function useAIWorkspace() {
  const locale=useLocale(),t=useTranslation();
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]),
    [activeId, setActiveId] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([]);
  const revisionSource=useRef<LibrarySource|null>(null);
  const [revisionName,setRevisionName]=useState("");
  function clearRevision(){revisionSource.current=null;setRevisionName("");}
  function prepareRevision(prompt:string,source?:LibrarySource){if(lock.current)return;revisionSource.current=source??null;setRevisionName(source?.name??"");setInput(prompt);}
  const [model, setModel] = useState("auto"),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [temporary, setTemporary] = useState(false),
    [historyQuery, setHistoryQuery] = useState(""),
    [archiveView, setArchiveView] = useState(false),
    [mobileHistory, setMobileHistory] = useState(false),
    [showTools, setShowTools] = useState(false);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [recording, setRecording] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [audioPlayback, setAudioPlayback] = useState<{
      messageId: string;
      conversationId: string | null;
      url: string;
    } | null>(null),
    [voiceBusy, setVoiceBusy] = useState(false),
    [voiceRequestMessageId, setVoiceRequestMessageId] = useState<string | null>(
      null,
    );
  const [dialog, setDialog] = useState<{
      kind: "delete" | "rename" | "edit";
      conversation?: Conversation;
      message?: Message;
    } | null>(null),
    [editValue, setEditValue] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null),
    [loading, setLoading] = useState(true),
    [pendingText, setPendingText] = useState("");
  const scroller = useRef<HTMLDivElement>(null),
    picker = useRef<HTMLInputElement>(null),
    composer = useRef<HTMLTextAreaElement>(null),
    lock = useRef(false),
    abort = useRef<AbortController | null>(null),
    follow = useRef(true);
  const media = useRef<MediaRecorder | null>(null),
    cancelRecording = useRef(false),
    openSequence = useRef(0),
    voiceGeneration = useRef(createVoiceGenerationGuard()),
    audioElement = useRef<HTMLAudioElement | null>(null);
  const streamed = useRef({ content: "", model: "auto" });
  const failedTool = useRef<string | undefined>(undefined);
  const sessionScope = useRef(createSessionGuard());
  const [sessionVersion, setSessionVersion] = useState(0);
  useEffect(()=>{clearRevision();},[sessionVersion]);
  const [newChatEpoch,setNewChatEpoch] = useState(0);
  const [sttModel, setSttModel] = useState("Fanar-Aura-STT-1");
  const [ttsModel, setTtsModel] = useState("Fanar-Aura-TTS-2");
  const loadHistory = useCallback(async () => {
    const scope = sessionScope.current,
      token = scope.capture(),
      owner = scope.owner();
    if (!owner) return;
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id,title,pinned,archived,selected_model,updated_at,temporary")
      .eq("user_id", owner)
      .eq("temporary", false)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(200);
    if (!scope.isCurrent(token)) return;
    if (error) throw error;
    setConversations((data ?? []) as Conversation[]);
  }, [supabase]);
  useEffect(() => {
    let alive = true;
    const scope = sessionScope.current;
    function reset(owner: string | null) {
      if (scope.owner() && scope.owner() !== owner)
        window.history.replaceState(null, "", "/ai");
      setSessionVersion(scope.reset(owner));
      abort.current?.abort();
      abort.current = null;
      lock.current = false;
      ++openSequence.current;
      stopVoice();
      cancelRecording.current = true;
      if (media.current?.state === "recording") media.current.stop();
      media.current?.stream.getTracks().forEach((t) => t.stop());
      if (synchronizeSessionWork(owner)) clearOriginalDocuments();
      setRecording(false);
      setBusy(false);
      setConversations([]);
      setMessages([]);
      streamed.current = { content: "", model: "auto" };
      setActiveId(null);
      setPendingText("");
      setInput("");
      setDocumentFiles([]);
      setAttachment(null);
      setDialog(null);
      setEditValue("");
      setHistoryQuery("");
      setError("");
      setNotice("");
      setModel("auto");
      setTemporary(false);
      failedTool.current = undefined;
      setSignedIn(Boolean(owner));
      setLoading(Boolean(owner));
    }
    async function initialize() {
      let token = scope.capture();
      try {
        const {
          data: { user },
        } = await sessionStep(supabase.auth.getUser());
        if (!alive || !scope.isCurrent(token)) return;
        if (user?.id !== scope.owner() && (user || scope.owner()))
          reset(user?.id ?? null);
        token = scope.capture();
        if (synchronizeSessionWork(user?.id ?? null)) clearOriginalDocuments();
        setSignedIn(Boolean(user));
        const prompt = new URLSearchParams(window.location.search).get(
          "prompt",
        );
        if (prompt) setInput(prompt.slice(0, 4000));
        // Consume the short-lived, owner-bound mastery context handed off by
        // /progress. No private educational evidence appears in the URL or a
        // referrer. Prefill is user-editable and is NEVER auto-submitted.
        try {
          const key = "noata-ai-pending-context-v1";
          const raw = sessionStorage.getItem(key);
          if (raw) {
            sessionStorage.removeItem(key);
            const pending: unknown = JSON.parse(raw);
            if (pending && typeof pending === "object") {
              const entry = pending as Record<string, unknown>;
              const age = Date.now() - Number(entry.createdAt);
              if (user && entry.owner === user.id &&
                  typeof entry.prompt === "string" &&
                  Number.isFinite(age) && age >= 0 && age <= 120000) {
                setInput(entry.prompt.slice(0, 2700));
              }
            }
          }
        } catch {
          // Private mode may forbid sessionStorage. Chat itself still works.
        }
        if (user) {
          const { data } = await sessionStep(
            supabase
              .from("user_settings")
              .select("default_ai_model")
              .eq("user_id", user.id)
              .maybeSingle(),
          );
          if (!alive || !scope.isCurrent(token)) return;
          if (data) {
            setModel(data.default_ai_model || "auto");
          }
          await sessionStep(loadHistory());
        }
      } catch (e) {
        if (alive && scope.isCurrent(token)) {
          setError(
            t("تعذّر التحقق من الجلسة حاليًا. يمكنك مراجعة الواجهة؛ أعد فتح الصفحة عندما يعود الاتصال.","Your session could not be verified. You can explore the interface; reopen the page when the connection returns."),
          );
        }
      } finally {
        if (alive && scope.isCurrent(token)) setLoading(false);
      }
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === "SIGNED_OUT") {
        reset(null);
        clearOriginalDocuments();
        clearSessionWork();
      } else if (session?.user.id && session.user.id !== scope.owner()) {
        reset(session.user.id);
        // Supabase auth callbacks must not await another auth operation.
        queueMicrotask(() => {
          if (alive) void initialize();
        });
      }
    });
    void initialize();
    return () => {
      subscription.unsubscribe();
      alive = false;
      scope.reset(null);
      abort.current?.abort();
      voiceGeneration.current.invalidate();
      audioElement.current?.pause();
      cancelRecording.current = true;
      if (media.current?.state === "recording") media.current.stop();
      media.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, [supabase, loadHistory]);
  useEffect(() => {
    if (!attachment || !attachment.type.startsWith("image/")) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(attachment);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [attachment]);
  useEffect(() => {
    if (follow.current && scroller.current)
      scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [messages, pendingText, busy]);
  useEffect(() => {
    if (!recording) return;
    setElapsed(0);
    const timer = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);
  useEffect(() => {
    if (recording && elapsed >= 120) media.current?.stop();
  }, [recording, elapsed]);
  function stopVoice() {
    voiceGeneration.current.invalidate();
    if (audioElement.current) {
      audioElement.current.pause();
      audioElement.current.removeAttribute("src");
      audioElement.current.load();
    }
    setAudioPlayback(null);
    setVoiceBusy(false);
    setVoiceRequestMessageId(null);
  }
  function stashComposer() {
    return composerDrafts.set(activeId ?? "new", {
      text: input,
      documents: documentFiles,
      attachment,
    });
  }
  function restoreComposer(id: string | null) {
    const saved = composerDrafts.get(id ?? "new");
    setInput(saved?.text ?? "");
    setDocumentFiles(saved?.documents ?? []);
    setAttachment(saved?.attachment ?? null);
  }
  async function openConversation(id: string) {
    if (lock.current) return;
    if (!stashComposer()) {
      setError(
        t("الملفات تتجاوز حد ذاكرة المسودات. أرسلها أو أزلها قبل تغيير المحادثة.","These files exceed draft memory limits. Send or remove them before switching conversations."),
      );
      return;
    }
    stopVoice();clearRevision();
    const seq = ++openSequence.current;
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("ai_messages")
        .select(columns)
        .eq("conversation_id", id)
        .order("created_at")
        .limit(500);
      if (error) throw error;
      if (seq !== openSequence.current) return;
      const row = conversations.find((c) => c.id === id);
      setActiveId(id);
      const restored = await Promise.all(
        (data ?? []).map(async (message) => {
          const meta = message.metadata as Record<string, unknown> | null;
          if (
            message.role === "user" &&
            typeof meta?.attachmentPath === "string"
          ) {
            const link = await supabase.storage
              .from("noata-uploads")
              .createSignedUrl(meta.attachmentPath, 3600);
            return {
              ...message,
              metadata: {
                ...meta,
                attachmentUrl: link.data?.signedUrl ?? null,
              },
            };
          }
          if (typeof meta?.assetPath === "string") {
            const signed = await supabase.storage
              .from("noata-generated")
              .createSignedUrl(meta.assetPath, 3600);
            if (signed.data)
              return {
                ...message,
                content: t("![صورة أنشأها Noata](","![Image generated by Noata](") + signed.data.signedUrl + ")",
              };
          }
          return message;
        }),
      );
      if (seq !== openSequence.current) return;
      setMessages(restored as Message[]);
      setPendingText("");
      setModel(row?.selected_model || "auto");
      setTemporary(false);
      setMobileHistory(false);
      restoreComposer(id);
      follow.current = true;
      window.history.replaceState(
        null,
        "",
        "/ai?chat=" + encodeURIComponent(id),
      );
    } catch (e) {
      if (seq === openSequence.current) setError(friendlyError(e,locale));
    } finally {
      if (seq === openSequence.current) setLoading(false);
    }
  }
  useEffect(() => {
    if (loading || activeId || !conversations.length) return;
    const id = new URLSearchParams(window.location.search).get("chat");
    if (id && conversations.some((c) => c.id === id)) void openConversation(id);
  }, [conversations, loading, activeId]);
  function newChat(temp = temporary) {
    if (lock.current) return;
    if (!stashComposer()) {
      setError(t("أرسل الملفات أو أزلها قبل بدء محادثة أخرى.","Send or remove your files before starting another conversation."));
      return;
    }
    stopVoice();
    clearRevision();setNewChatEpoch(x=>x+1);
    setDocumentFiles([]);
    setAttachment(null);
    ++openSequence.current;
    setActiveId(null);
    setMessages([]);
    setPendingText("");
    failedTool.current = undefined;
    restoreComposer(null);
    setError("");
    setNotice("");
    setTemporary(temp);
    setMobileHistory(false);
    window.history.replaceState(null, "", "/ai");
    composer.current?.focus();
  }
  function assertSession(token: number) {
    if (!sessionScope.current.isCurrent(token) || !sessionScope.current.owner())
      throw new DOMException("Session changed", "AbortError");
  }
  async function ensureConversation(text: string, token: number) {
    assertSession(token);
    if (activeId) return activeId;
    if (temporary) return "temporary";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    assertSession(token);
    if (!user) throw Error("auth expired");
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        title: titleFrom(text,locale),
        selected_model: model,
        temporary: false,
      })
      .select("id")
      .single();
    assertSession(token);
    if (error || !data) throw error ?? Error("save failed");
    setActiveId(data.id);
    window.history.replaceState(null, "", "/ai?chat=" + data.id);
    return data.id;
  }
  async function upload(file: File, conversationId: string, token: number) {
    assertSession(token);
    const invalid = validateAttachment(file,locale);
    if (invalid) throw Error(invalid);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    assertSession(token);
    if (!user) throw Error("auth expired");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-70);
    const path =
      user.id + "/" + conversationId + "/" + crypto.randomUUID() + "-" + safe;
    const { error } = await supabase.storage
      .from("noata-uploads")
      .upload(path, file, {
        contentType: file.type || "text/plain",
        upsert: false,
      });
    assertSession(token);
    if (error) throw error;
    const record = await supabase.from("ai_attachments").insert({
      user_id: user.id,
      conversation_id: conversationId === "temporary" ? null : conversationId,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
      filename:file.name.replace(/[\\/]/g,"-").slice(0,180),
      library_saved:conversationId!=="temporary",
    });
    assertSession(token);
    if (record.error) {
      await supabase.storage.from("noata-uploads").remove([path]);
      throw record.error;
    }
    return path;
  }
  async function assertFanarConfigured(token: number, signal: AbortSignal) {
    // Check availability before creating a conversation or writing messages.
    // This checks credentials presence, not live inference or provider health.
    const { data, error } = await supabase.functions.invoke(AI_FUNCTION, {
      body: { action: "readiness" },
      signal,
    });
    assertSession(token);
    if (error) {
      const context = (error as { context?: unknown }).context;
      if (context instanceof Response) {
        const body = await context.json().catch(() => null);
        throw Error(aiResponseFailure(context.status, body));
      }
      throw error;
    }
    if (data?.configured === false) throw Error("FANAR_NOT_CONFIGURED");
    if (data?.configured !== true) throw Error("FANAR_UNAVAILABLE");
  }
  async function invoke(payload: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke(AI_FUNCTION, {
      body: { ...payload, requestId: crypto.randomUUID() },
      signal: abort.current?.signal,
      timeout: 180000,
    });
    if (error) {
      const context = (error as { context?: unknown }).context;
      if (context instanceof Response) {
        const body = await context.json().catch(() => null);
        throw Error(aiResponseFailure(context.status, body));
      }
      throw error;
    }
    if (data?.error) throw Error(String(data.error));
    return data;
  }
  async function chat(
    history: Message[],
    token: number,
    signal: AbortSignal,
    attachmentPath?: string,
    languageOverride?: "ar"|"en",
    artifactFormat?: CreatedArtifact["format"],
  ) {
    const language=languageOverride??requestLanguage(history.findLast(message=>message.role==="user")?.content??"",locale);
    return continueChat((prefix,selectedModel) => {
      const context = prefix ? [...history, {
        id:"continuation-response", conversation_id:"", role:"assistant" as const,
        content:prefix,model:selectedModel??model,status:"continuing",created_at:new Date().toISOString(),
      }, {
        id:"continuation-request",conversation_id:"",role:"user" as const,
        content:language==="en" ? "Continue the same answer from exactly where it stopped. Do not repeat earlier sections or add an introduction. Finish the remaining requested content in English." : "أكمل نفس الإجابة من موضع التوقف دون تكرار الأقسام السابقة أو إضافة مقدمة. أكمل المحتوى المطلوب بالعربية.",
        model:null,status:"complete",created_at:new Date().toISOString(),
      }] : history;
      return chatPart(context,token,signal,attachmentPath,prefix,selectedModel,language,artifactFormat);
    },signal);
  }
  async function chatPart(
    history:Message[],token:number,signal:AbortSignal,attachmentPath?:string,
    prefix="",selectedModel?:string,responseLanguage:"ar"|"en"=locale,
    artifactFormat?:CreatedArtifact["format"],
  ):Promise<ChatPart> {
    assertSession(token);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    assertSession(token);
    if (!session) throw Error("auth expired");
    const response = await supabaseFetch(
      SUPABASE_URL + "/functions/v1/" + AI_FUNCTION,
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + session.access_token,
          apikey: SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "chat",
          ...(artifactFormat?{artifactFormat}:{}),
           model:selectedModel??model,
          messages: createAiMessageContext(history),
          attachmentPath,
          conversationId:history.findLast(item=>item.conversation_id&&item.conversation_id!=="temporary")?.conversation_id,
           stream: true,
           responseLanguage,
           temporary,
           max_tokens:4096,
          requestId: crypto.randomUUID(),
        }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(165000)]),
      },
    );
    assertSession(token);
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw Error(aiResponseFailure(response.status, body));
    }
    if (!response.headers.get("content-type")?.includes("text/event-stream")) {
      const data = await response.json();
      assertSession(token);
      if (data.error) throw Error(String(data.error));
      if (!data.content) throw Error("Empty response");
      return {
        content: String(data.content),
        model: String(data.model ?? model),
        finishReason:String(data.finishReason??"stop"),incomplete:data.incomplete===true,
        research:validatedResearch(data.research),routeNote:data.routeNote,timings:data.timings,
      };
    }
    const reader = response.body!.getReader(),
      decoder = new TextDecoder();
    let buffer = "",
      content = "",
      used = model,
      done = false,finishReason="stop",incomplete=false;
    let research:Research|undefined,timings:ChatPart["timings"],routeNote:string|undefined;
    try {
      for (;;) {
        const part = await reader.read();
        assertSession(token);
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        if (buffer.length > 1024 * 1024) throw Error("Stream frame too large");
        const parsed = parseStreamFrames(buffer);
        buffer = parsed.rest;
        for (const frame of parsed.data) {
          const event = JSON.parse(frame);
          if (event.error) throw Error(event.error);
          if(event.research)research=validatedResearch(event.research);
          if(event.routeNote==="sadiq_2_unavailable_sadiq_1"){routeNote=event.routeNote;setNotice(t("صادق 2 غير مفعّل؛ الوضع التلقائي يستخدم صادق لهذا الرد.","Sadiq 2 is not enabled; Auto is using Sadiq for this answer."));}
          if(event.status==="searching")setNotice(t("بنبحث عن مصادر موثوقة…","Searching for reliable sources…"));
          if(event.status==="reviewing")setNotice(t("بنراجع المقاطع المسترجعة…","Reviewing retrieved excerpts…"));
          if(event.status==="preparing")setNotice(research?.status==="complete"?t("بنجهّز الرد من المصادر…","Preparing an answer from the sources…"):t("البحث المباشر غير متاح؛ المعلومات الحالية لم يتم التحقق منها.","Live research is unavailable; current information has not been verified."));
          if (typeof event.content === "string") {
            if (event.content.length > 500000)
              throw Error("Response too large");
            content = event.content;
             const combined=prefix?prefix+"\n\n"+content:content;
             streamed.current = { content:combined, model: event.model || used };
             setPendingText(combined);
          }
          if (event.model) used = event.model;
          if (event.done) { done = true; finishReason=event.finishReason??"stop";incomplete=event.incomplete===true;timings=event.timings; }
        }
      }
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    if (!done) throw Error("Stream interrupted");
    if (!content.trim()) throw Error("Empty response");
    return { content, model: used,finishReason,incomplete,research,timings,routeNote };
  }
  async function persist(row: Message) {
    if (temporary) return row;
    const { data, error } = await supabase
      .from("ai_messages")
      .insert({
        id: row.id,
        conversation_id: row.conversation_id,
        role: row.role,
        content: row.content,
        model: row.model,
        status: row.status,
        metadata:
          (row.metadata as import("@/lib/supabase/database.types").Json) ?? {},
      })
      .select(columns)
      .single();
    if (error) throw error;
    return data as Message;
  }
  async function send(
    e?: FormEvent,
    mode: "send" | "retry" | "regenerate" | "continue" = "send",
    tool?: string,
    directPrompt?: string,
  ) {
    e?.preventDefault();
    if (lock.current || recording || loading) return;
    if ((attachment || documentFiles.length > 0) && (tool || mode !== "send")) {
      setError(
        t("المرفقات الجديدة تدعم الرسالة العادية فقط. أرسل الملفات أولًا قبل استخدام الأدوات أو إعادة توليد رد.","Send new attachments in a normal message before using tools or regenerating an answer."),
      );
      return;
    }
    if (!signedIn) {
      window.location.href = "/login?next=/ai";
      return;
    }
    const text =
      mode === "continue"
        ? t("كمّل شرحك من النقطة اللي وقفت عندها.","Continue your explanation from where you stopped.")
        : mode === "retry"
          ? (messages.findLast((m) => m.role === "user")?.content ?? "")
          : (directPrompt?.trim() || input.trim()) ||
            (documentFiles.length > 0 ||
            (attachment &&
              (isTextDocument(attachment) || isDocxDocument(attachment)))
              ? t("قارن الملفات المرفقة واشرح ما يدعمه كل مصدر، مع الاستشهاد بأسماء الملفات.","Compare the attached files and explain what each source supports, citing file names.")
              : attachment?.type.startsWith("image/")
                ? t("حلّل الصورة المرفقة.","Analyze the attached image.")
                : "");
    const editingSource=mode==="send"?revisionSource.current:null;
    // A genuine natural-language image request can use Fanar's existing
    // authenticated image capability without opening a separate Tools panel.
    // Editing, SVG, multi-image and Temporary requests are intentionally excluded.
    const needsImageSubject=mode==="send"&&!attachment&&!documentFiles.length&&imageNeedsSubject(text);
    const plannedCapability=planNoataRequest(text,{
      mode,temporary,hasUploads:Boolean(attachment||documentFiles.length),explicitTool:tool
    });
    if(!tool && plannedCapability.kind==="image")tool="image";
    if (mode === "retry") tool = failedTool.current;
    else failedTool.current = tool;
    if (mode === "send" && !text) return;
    const token = sessionScope.current.capture();
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setPendingText("");
    streamed.current = { content: "", model };
    follow.current = true;
    const controller = new AbortController();
    abort.current = controller;
    let history = messages;
    let conversationId = activeId ?? "temporary";
    let assistant: Message | undefined;
    let savedResponse = false;
    let temporaryUploadPath: string | undefined;
    let uploadedPath: string | undefined;
    let retainedDocumentIds: string[] = [];
    let sourcesSaved = false;
    let metadataPlan:unknown;
    try {
      await assertFanarConfigured(token, controller.signal);
      assertSession(token);
      conversationId = await ensureConversation(
        text || messages[0]?.content || t("محادثة","Conversation"),
        token,
      );
      assertSession(token);
      if (
        mode === "regenerate" ||
        (mode === "retry" &&
          messages.at(-1)?.role === "assistant" &&
          messages.at(-1)?.status !== "complete")
      ) {
        history = messages.slice(0, -1);
      }
      let path: string | undefined;
      let documentExcerpt: string | undefined;
      let documentTruncated = false;
      const documentSources = documentFiles.length
        ? await extractDocumentBatch(documentFiles, text)
        : [];
      assertSession(token);
      if (documentSources.length) {
        setNotice(
          temporary
            ? t("بنقرأ مستنداتك دون حفظ الأصل…","Reading your documents without saving originals…")
            : t("بنجهّز المستندات الأصلية…","Preparing original documents…"),
        );
        retainedDocumentIds = await retainOriginalDocuments(
          documentSources,
          documentFiles,
          conversationId,
          temporary,
          abort.current?.signal,
        );
        if (!temporary && !retainedDocumentIds.length)
          setNotice(
            t("حفظ الأصل غير مفعّل؛ المعاينة الكاملة متاحة خلال جلسة الرفع فقط.","Saving originals is unavailable. Full preview remains available during this upload session."),
          );
      }
      assertSession(token);
      if (attachment) {
        if (isTextDocument(attachment) || isDocxDocument(attachment)) {
          setNotice(t("بنقرأ محتوى المستند…","Reading document content…"));
          const extracted = isDocxDocument(attachment)
            ? await extractDocxDocument(attachment)
            : await extractTextDocument(attachment);
          documentExcerpt = extracted.excerpt;
          documentTruncated = extracted.truncated;
          // Private upload bucket currently only accepts image/audio.
          // Preserve a bounded, RLS-protected text excerpt in message metadata;
          // never mislabel it as a stored original file.
          setNotice(t("بنجهّز النص للمحادثة…","Preparing text for the conversation…"));
        } else {
          setNotice(t("بنرفع الملف…","Uploading file…"));
          path = await upload(attachment, conversationId, token);
          uploadedPath = path;
          if (temporary) temporaryUploadPath = path;
        }
        setNotice("");
      }
      assertSession(token);
      if (mode === "send" || mode === "continue") {
        const row: Message = {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: "user",
          content: text,
          metadata: {
            ...(attachment
              ? {
                  ...(path ? { attachmentPath: path } : {}),
                  attachmentName: attachment.name,
                  attachmentMime: attachment.type || "text/plain",
                  ...(documentExcerpt
                    ? { documentExcerpt, documentTruncated }
                    : {}),
                }
              : {}),
            ...(documentSources.length ? { documentSources } : {}),
          },
          model: null,
          status: "complete",
          created_at: new Date().toISOString(),
        };
        const saved = await persist(row);
        sourcesSaved = true;
        assertSession(token);
        if (path && attachment) {
          const signed = await supabase.storage
            .from("noata-uploads")
            .createSignedUrl(path, 3600);
          saved.metadata = {
            ...(saved.metadata ?? {}),
            attachmentUrl: signed.data?.signedUrl ?? null,
          };
        }
        assertSession(token);
        history = [...history, saved];
        setMessages(history);
        setInput("");
        composerDrafts.delete(activeId ?? "new");
        composerDrafts.delete(conversationId);
        setAttachment(null);
        setDocumentFiles([]);
      }
      const priorUserRequests=history.slice(0,-1).filter(row=>row.role==="user").map(row=>row.content);
      const contextualFile=mode==="send"&&!tool&&!temporary
        ?confirmedFileIntent(text,priorUserRequests):null;
      let requestedFile=plannedCapability.kind==="artifact"?plannedCapability.intent:contextualFile;
      let requestedFiles:ArtifactIntent[]=mode==="send"&&!tool&&!temporary&&!attachment&&!documentFiles.length
        ?detectArtifactIntents(text):requestedFile?[requestedFile]:[];
      requestedFile=requestedFiles[0]??requestedFile;
      let planQuestion="";
      // Semantic proposals select only allowlisted, authenticated file engines.
      // Temporary, explicit tools and retries keep their existing no-side-effect boundaries.
      if(mode==="send"&&!tool&&!temporary&&!contextualFile&&needsSemanticPlan(text)){
        setNotice(t("بنحدد المطلوب من رسالتك…","Understanding your request…"));
        try{
          const proposed=await invoke({action:"plan",request:text,locale:requestLanguage(text,locale),
            context:history.slice(0,-1).slice(-4).map(row=>({role:row.role,content:responseText(row.content).slice(0,2400)}))});
          assertSession(token);controller.signal.throwIfAborted();
          const plan=validateSemanticPlan(proposed.plan);
          if(!plan)throw Error("invalid_plan");
          if(plan.kind==="files"){
            requestedFiles=plan.formats.map(kind=>({kind,usePrevious:plan.usePrevious}));
            requestedFile=requestedFiles[0];
            metadataPlan=plan;
          }else if(plan.kind==="clarify"){
            planQuestion=plan.question;requestedFile=null;requestedFiles=[];
          }
          setNotice("");
        }catch(planningError){
          controller.signal.throwIfAborted();assertSession(token);
          // The conservative existing single-format path remains available.
          // A failed plan is never represented as a completed multi-file operation.
          if(!requestedFile)setNotice(t("تعذّر التأكد من اختيار الملفات. هنحتفظ بالرد؛ مش هنعلن إنشاء ملفات من غير نتيجة فعلية.","File selection could not be verified. The answer will be kept; no file will be claimed without an actual result."));
          else setNotice("");
        }
      }
      const priorForFile=history.slice(0,-1).findLast(row=>row.role==="assistant");
      const priorFileText=responseText(priorForFile?.content??"");
      const priorResearch=validatedResearch(priorForFile?.metadata?.research);
      const convertPrevious=Boolean(requestedFile?.usePrevious&&priorForFile?.status==="complete"
        &&canCreateArtifactFromAnswer("",priorFileText,true)&&!isNonDeliverableDraft(priorFileText)
        &&(!priorResearch||priorResearch.status==="complete"));
      let result: ChatPart;
      let metadata: Record<string, unknown> = metadataPlan?{operationPlan:metadataPlan}:{};
      const direct=mode==="send"&&!tool?directArtifactAbilityAnswer(text,locale):null;
      if(planQuestion){
        metadata.capabilityProbe=true;result={content:planQuestion,model:"Noata"};
      } else if(convertPrevious){
        result={content:requestLanguage(text,locale)==="ar"
          ?"أستخدم الرد السابق كمصدر للملف المطلوب. نتيجة الإنشاء هتظهر هنا بعد الفحص والحفظ."
          :"I’m using your previous answer as the source. The file will appear here after validation and saving.",model:"Noata"};
      } else if(needsImageSubject){
        metadata.capabilityProbe=true;
        result={content:t("تحب أرسم إيه بالضبط؟ اذكر الموضوع أو الفكرة، ومعاها الستايل اللي تفضله لو تحب.","What would you like me to create? Give me a subject or idea, and optionally the style you prefer."),model:"Noata"};
      } else if(direct){
        metadata.capabilityProbe=true;
        result={content:direct,model:"Noata"};
      } else if (tool) {
        const payload: Record<string, unknown> = { action: tool };
        if (tool === "translate")
          Object.assign(payload, {
            text,
            langpair: /[\u0600-\u06ff]/.test(text) ? "ar-en" : "en-ar",
          });
        else if (tool === "image" || tool === "poem") payload.prompt = text;
        else if (tool === "moderate")
          Object.assign(payload, { prompt: text, response: "" });
        else payload.input = { query: text, prompt: text };
        const data = await invoke(payload);
        assertSession(token);
        if (tool === "image" && data.asset?.path)
          metadata.assetPath = data.asset.path;
        const content =
          tool === "image"
            ? data.asset?.signedUrl
              ? t("![صورة أنشأها Noata](","![Image generated by Noata](") + data.asset.signedUrl + ")"
              : ""
            : toolOutputText(data.result);
        if (!content) throw Error("No output");
        result = { content, model: tool };
      } else {
        const priorPath =
          mode !== "send"
            ? history.findLast(
                (m) =>
                  m.role === "user" &&
                  typeof m.metadata?.attachmentPath === "string",
              )?.metadata?.attachmentPath
            : undefined;
        result = await chat(
          history,
          token,
          controller.signal,
          path ?? (typeof priorPath === "string" ? priorPath : undefined),
          requestedFile?requestLanguage(text,locale):undefined,
          requestedFile?.kind,
        );
      }
      assertSession(token);
      let researchBlocked=Boolean(result.research&&result.research.status!=="complete");
      // Retry a proposed outline once to obtain ACTUAL requested document content.
      // This never stores the synthetic retry instruction in conversation history.
      if(requestedFile&&!convertPrevious&&!researchBlocked&&!result.incomplete&&(isNonDeliverableDraft(responseText(result.content))||isArtifactRefusal(responseText(result.content)))){
        setNotice(t("الرد مجرد مخطط؛ بنطلب المستند المكتمل قبل إنشاء الملف…","That was only a proposal. Asking for the finished document before creating a file…"));
        try{
          const repaired=await chat(history,token,controller.signal,undefined,requestLanguage(text,locale),requestedFile.kind);
          assertSession(token);
          if(!repaired.incomplete&&!isNonDeliverableDraft(responseText(repaired.content))
             &&!isArtifactRefusal(responseText(repaired.content)))result=repaired;
        }catch{ /* Preserve response and never pretend that a real file was created. */ }
      }
      researchBlocked=Boolean(result.research&&result.research.status!=="complete");
      // Correct contradictory provider capability refusals BEFORE persisting.
      // A plain capability question never triggers an empty/refusal PDF.
      if (mode==="send" && !tool && !result.incomplete)
        result={...result,content:safeArtifactReplyOnCapabilityQuestion(text,result.content,locale)};
      if(result.incomplete){
        metadata.incomplete=true;
        setNotice(t("الرد محفوظ جزئيًا. اضغط «كمّل الرد» لإكماله.","Partial answer saved. Choose Continue answer to finish it."));
      }
      if(result.research)metadata.research=result.research;
      if(result.routeNote)metadata.routeNote=result.routeNote;
      if(result.timings)metadata.timings=result.timings;
      assistant = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "assistant",
        content: result.content,
        metadata,
        model: result.model,
        status: result.incomplete?"stopped":"complete",
        created_at: new Date().toISOString(),
      };
      if (
        (mode === "regenerate" ||
          (mode === "retry" &&
            messages.at(-1)?.role === "assistant" &&
            messages.at(-1)?.status !== "complete")) &&
        !temporary
      ) {
        const old = messages.at(-1)!;
        const { data, error } = await supabase
          .from("ai_messages")
          .update({
            content: result.content,
            model: result.model,
            status: result.incomplete?"stopped":"complete",
            metadata:metadata as import("@/lib/supabase/database.types").Json,
          })
          .eq("id", old.id)
          .select(columns)
          .single();
        if (error) throw error;
        assistant = data as Message;
      } else assistant = await persist(assistant);
      assertSession(token);
      setMessages([...history, assistant]);
      // The persisted reply replaces its streaming copy before file work begins.
      setPendingText("");
      savedResponse = true;
      // Explicit file requests now produce a genuine owned artifact as part of
      // the answer lifecycle. No file, link or success state is invented on failure.
      const previousAnswer=history.slice(0,-1).findLast(row=>row.role==="assistant")?.content??"";
      const fileIntent=!tool&&!result.incomplete&&!temporary&&!researchBlocked?requestedFile:null;
      // Refusals are not document source material. Follow-up exports may use a
      // prior actual answer, even if Fanar misunderstood the new instruction.
      const artifactSource=fileIntent?artifactContent(fileIntent,responseText(result.content),responseText(previousAnswer)):"";
      const artifactRequest=fileIntent&&canCreateArtifactFromAnswer(responseText(result.content),responseText(previousAnswer),fileIntent.usePrevious)
        &&!isNonDeliverableDraft(artifactSource)?fileIntent:null;
      if(researchBlocked&&requestedFile)setNotice(t("تعذّر جلب المصادر الحالية. لم يتم إنشاء تقرير أو رسم من بيانات غير موثّقة.","Current sources could not be retrieved. No report or chart was created from unverified data."));
      if(fileIntent&&!artifactRequest)setNotice(t("لسه مفيش محتوى نهائي صالح للملف. لم يتم إنشاء PDF أو ملف وهمي.","The reply still lacks finished document content. No empty or misleading file was generated."));
      if (artifactRequest) {
        setNotice(t("بننشئ الملف ونفحصه ونحفظه في مكتبتك…","Generating, validating and saving your file…"));
        try {
          const who = await supabase.auth.getUser();
          assertSession(token);
          if (who.error || !who.data.user?.id) throw Error("auth_expired");
          const owner = who.data.user.id;
          const prior = previousAnswer;
          const completedFiles:CreatedArtifact[]=[];
          const failedFormats:string[]=[];
          const fileFailures:{format:string;reason:string}[]=[];
          for(let fileIndex=0;fileIndex<requestedFiles.length;fileIndex++){
          const currentIntent=requestedFiles[fileIndex];
          controller.signal.throwIfAborted();assertSession(token);
          setNotice(t("بنجهّز ملف","Preparing file")+" "+(fileIndex+1)+" / "+requestedFiles.length+" · "+currentIntent.kind.toUpperCase());
          try{
          let currentContent=result.content;
          if(fileIndex>0&&!currentIntent.usePrevious){
            let next=await chat(history,token,controller.signal,undefined,requestLanguage(text,locale),currentIntent.kind);
            assertSession(token);setPendingText("");
            const nextText=responseText(next.content);
            const sourceIssue=checkArtifactContent(currentIntent.kind,nextText);
            if(!next.incomplete&&(sourceIssue||isArtifactRefusal(nextText)||isNonDeliverableDraft(nextText))){
              next=await chat(history,token,controller.signal,undefined,requestLanguage(text,locale),currentIntent.kind);
              assertSession(token);setPendingText("");
            }
            if(next.incomplete||next.research&&next.research.status!=="complete")throw Error("unfinished_content");
            currentContent=next.content;
          }
          const source = artifactContent(currentIntent,responseText(currentContent),responseText(prior));
          const chartData = currentIntent.kind === "pdf"
            ? findActualLineChart(currentIntent.usePrevious && prior.trim()?prior:currentContent)
            : null;
          if(editingSource){
            const split=text.split(/Verified extracted original document content:|المحتوى الأصلي للملف:/);
            const before=split.slice(1).join("\n");
            if(before&&revisionMayLoseContent(before,source,split[0]))throw Error("revision_content_loss");
          }
          const id = crypto.randomUUID();
          const driver:ArtifactDriver = {
            renderPdf: async(text,title,signal) => {
              const response = await fetch(chartData?"/api/ai/chart-pdf":"/api/documents/pdf",{
                method:"POST",credentials:"same-origin",
                headers:{"Content-Type":"application/json","Accept-Language":locale},
                body:JSON.stringify(chartData?{chart:chartData,text,title:title.slice(0,120)}:{text,title:title.slice(0,120)}),signal
              });
              if(!response.ok)throw Error("pdf_service_"+response.status);
              return new Uint8Array(await response.arrayBuffer());
            },
            upload:async(path,bytes,mimeType)=>{
              const result=await supabase.storage.from("noata-ai-artifacts")
                .upload(path,new Blob([Uint8Array.from(bytes)],{type:mimeType}),{contentType:mimeType,upsert:false});
              if(result.error)throw result.error;
            },
            insert:async(artifact,user_id)=>{
              const result=await supabase.from("ai_artifacts").insert({
                id:artifact.id,user_id,filename:artifact.filename,mime_type:artifact.mimeType,
                storage_path:artifact.storagePath,byte_size:artifact.byteSize,source_content:source.slice(0,160000),
                ...(editingSource?.artifactId?{parent_artifact_id:editingSource.artifactId}:editingSource?.documentId?{source_document_id:editingSource.documentId}:{})
              });
              if(result.error)throw result.error;
            },
            attach:async artifact=>{
              assertSession(token);controller.signal.throwIfAborted();
              const metadata={...(assistant!.metadata ?? {}),generatedArtifacts:[...completedFiles,artifact],generatedArtifact:completedFiles[0]??artifact};
              const result=await supabase.from("ai_messages").update({
                metadata:metadata as import("@/lib/supabase/database.types").Json
              }).eq("id",assistant!.id).eq("conversation_id",conversationId).select("id").single();
              if(result.error)throw result.error;
            },
            remove:async path=>{
              const result=await supabase.storage.from("noata-ai-artifacts").remove([path]);
              if(result.error)throw result.error;
            },
            removeRecord:async id=>{
              const result=await supabase.from("ai_artifacts").delete().eq("id",id).eq("user_id",owner);
              if(result.error)throw result.error;
            }
          };
          const artifact = await createConversationalArtifact({
            intent:currentIntent,content:source,owner,id,signal:controller.signal,
            title:titleFrom(text,locale),driver
          });
          assertSession(token);
          completedFiles.push(artifact);
          assistant={...assistant,metadata:{...assistant.metadata,generatedArtifacts:[...completedFiles],generatedArtifact:completedFiles[0]}};
          setMessages([...history,assistant]);
          }catch(fileError){
            controller.signal.throwIfAborted();assertSession(token);
            failedFormats.push(currentIntent.kind.toUpperCase());
            const message=fileError instanceof Error?fileError.message:"";
            const reason=["revision_content_loss","table_required","slides_required","unfinished_content","too_large","generated_file_invalid","auth_expired"].includes(message)
              ?message:/Text too long for readable slides|up to 30 slides/.test(message)?"slide_layout_limit"
              :/^pdf_service_/.test(message)?"pdf_service_error":"file_generation_or_storage";
            fileFailures.push({format:currentIntent.kind,reason});
          }finally{if(sessionScope.current.isCurrent(token))setPendingText("");}
          }
          if(fileFailures.length&&!temporary){
            const metadata={...(assistant!.metadata??{}),fileFailures};
            const rejected=await supabase.from("ai_messages").update({metadata:metadata as import("@/lib/supabase/database.types").Json})
              .eq("id",assistant!.id).eq("conversation_id",conversationId).select("id").single();
            if(rejected.error)throw rejected.error;
            assistant={...assistant!,metadata};
          }
          if(!completedFiles.length)throw Error(fileFailures.some(f=>f.reason==="revision_content_loss")?"revision_content_loss":"no_completed_files");
          // A real artifact was persisted. Remove a conflicting provider refusal
          // from the visible and stored response only after confirmed success.
          let finalContent=assistant.content;
          if(convertPrevious||isArtifactRefusal(finalContent)){
            finalContent=requestLanguage(text,locale)==="ar"
              ?"اتجهّز الملف من محتوى الرد السابق واتحفظ في مكتبتك الخاصة. تقدر تفتحه أو تنزّله من البطاقة تحت."
              :"The file was created from your previous answer and saved in your private library. You can open or download it below.";
            const changed=await supabase.from("ai_messages").update({content:finalContent})
              .eq("id",assistant.id).eq("conversation_id",conversationId).select("id").single();
            if(changed.error)throw changed.error;
          }
          assistant={...assistant,content:finalContent,metadata:{...assistant.metadata,generatedArtifacts:completedFiles,generatedArtifact:completedFiles[0]}};
          setMessages([...history,assistant]);
          setNotice(failedFormats.length
            ?t("اتحفظ","Saved")+" "+completedFiles.length+" / "+requestedFiles.length+". "+t("تعذّر إنشاء: ","Could not create: ")+failedFormats.join(", ")
            :t("ملفاتك جاهزة في الرد وفي مكتبتك الخاصة.","Your files are ready in this reply and your private library."));
        } catch (artifactError) {
          if (sessionScope.current.isCurrent(token)) {
            const reason=artifactError instanceof Error?artifactError.message:"";
            const detail=reason==="revision_content_loss"
              ?t("التعديل حذف جزءًا كبيرًا من المحتوى. لم نحفظ ملفًا مختصرًا بدل الأصل؛ راجع الرد أو أعد الطلب مع الحفاظ على كل الأقسام.","The revision removed a substantial amount of content. No shortened file replaced the original. Review the response or request a revision that preserves every section.")
              :reason==="table_required"
              ?t("إنشاء Excel يحتاج جدول بيانات حقيقي في الرد.","Excel generation requires an actual data table in the response.")
              :reason==="slides_required"
              ?t("إنشاء PowerPoint يحتاج عناوين شرائح منظّمة.","PowerPoint generation requires structured slide headings.")
              :t("تعذّر توليد الملف أو حفظه؛ الرد النصي محفوظ ويمكن تصديره يدويًا.","File creation or storage failed. The answer remains saved and can be exported manually.");
            setNotice(detail);
          }
        }
      }
      clearRevision();
      setAttachment(null);
      setDocumentFiles([]);
      if (picker.current) picker.current.value = "";
      setShowTools(false);
      if (!temporary) {
        const updated = await supabase
          .from("ai_conversations")
          .update({
            updated_at: new Date().toISOString(),
            selected_model: model,
          })
          .eq("id", conversationId);
        if (updated.error) throw updated.error;
        await loadHistory();
      }
    } catch (e) {
      if (!sessionScope.current.isCurrent(token)) return;
      setNotice("");
      if(controller.signal.aborted){
        setError("");
        setNotice(t("تم إيقاف العملية. الملفات المكتملة محفوظة؛ لم نعلن اكتمال أي جزء لم ينتهِ.","Stopped. Completed deliverables are kept; unfinished work was not marked complete."));
      } else if (
        /PROVIDER_MODEL_ACCESS_DENIED/.test(e instanceof Error ? e.message : String(e)) &&
        model.startsWith("Fanar-Sadiq")
      ) {
        // The provider has not authorised this specialist model for the configured key.
        // Switch to Auto so Retry succeeds on the general model instead of failing again.
        setModel("auto");
        setError(
          t(
            "صادق غير مصرّح به لمفتاح Fanar الحالي. حوّلنا النموذج إلى الوضع التلقائي؛ اضغط إعادة المحاولة لإرسال رسالتك.",
            "Sadiq is not authorized for the current Fanar key. We switched to Auto; press Retry to send your message.",
          ),
        );
      } else setError(friendlyError(e,locale));
      if (!assistant && streamed.current.content && mode !== "regenerate") {
        const partial: Message = {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: "assistant",
          content: streamed.current.content,
          model: streamed.current.model,
          status: controller.signal.aborted ? "stopped" : "failed",
          created_at: new Date().toISOString(),
          metadata: { incomplete: true },
        };
        try {
          let saved: Message;
          const previous = messages.at(-1);
          if (
            mode === "retry" &&
            !temporary &&
            previous?.role === "assistant" &&
            previous.status !== "complete"
          ) {
            const result = await supabase
              .from("ai_messages")
              .update({
                content: partial.content,
                model: partial.model,
                status: partial.status,
                metadata: { incomplete: true },
              })
              .eq("id", previous.id)
              .select(columns)
              .single();
            assertSession(token);
            if (result.error) throw result.error;
            saved = result.data as Message;
          } else saved = await persist(partial);
          assertSession(token);
          setMessages([...history, saved]);
          setPendingText("");
          setNotice(
            t("تم الاحتفاظ بالرد الجزئي مع توضيح أنه غير مكتمل. يمكنك إكماله أو إعادة توليده.","The partial answer was saved and marked incomplete. You can continue or regenerate it."),
          );
        } catch {
          if (sessionScope.current.isCurrent(token))
            setNotice(
              t("الرد الجزئي ظاهر هنا، لكن حفظه لم يتأكد. انسخه قبل مغادرة الصفحة.","The partial answer is visible, but saving was not confirmed. Copy it before leaving."),
            );
        }
      }
      if (assistant && !savedResponse) {
        setPendingText(assistant.content);
        setNotice(t("الرد ظاهر هنا، لكن حفظه لم يتأكد. انسخه قبل مغادرة الصفحة.","The answer is visible, but saving was not confirmed. Copy it before leaving."));
      }
    } finally {
      if (!sessionScope.current.isCurrent(token)) return;
      try {
        if (savedResponse) setPendingText("");
        if (!sourcesSaved && retainedDocumentIds.length) {
          try {
            await deleteOriginalDocuments(retainedDocumentIds);
          } catch {
            if (sessionScope.current.isCurrent(token))
              setError(
                t("تعذّر تنظيف المستندات بعد فشل حفظ الرسالة. حاول حذفها من المحادثة.","Document cleanup failed after the message could not be saved. Try removing them from the conversation."),
              );
          }
        }
        if (!sessionScope.current.isCurrent(token)) return;
        temporaryUploadPath ??= !sourcesSaved ? uploadedPath : undefined;
        if (temporaryUploadPath) {
          // Temporary images are used for inference then erased from Storage
          // and the attachment index, even if inference fails.
          const [storageResult, recordResult] = await Promise.all([
            supabase.storage
              .from("noata-uploads")
              .remove([temporaryUploadPath]),
            supabase
              .from("ai_attachments")
              .delete()
              .eq("storage_path", temporaryUploadPath),
          ]);
          if (
            sessionScope.current.isCurrent(token) &&
            (storageResult.error || recordResult.error)
          ) {
            setError(
              t("تعذّر تنظيف المرفق المؤقت بالكامل. جرّب حذف البيانات المؤقتة من إعدادات الحساب.","Temporary attachment cleanup was not completed. Check temporary data in your account settings."),
            );
          }
        }
      } catch {
        if (sessionScope.current.isCurrent(token))
          setError(t("تعذّر تنظيف بعض المرفقات المؤقتة. راجع إعدادات بياناتك.","Some temporary attachments could not be removed. Check your data settings."));
      } finally {
        if (sessionScope.current.isCurrent(token)) {
          setBusy(false);
          lock.current = false;
          abort.current = null;
        }
      }
    }
  }
  async function historyAction(
    c: Conversation,
    action: "pin" | "archive" | "rename" | "delete",
  ) {
    const token = sessionScope.current.capture();
    if (lock.current) return;
    if (action === "rename" || action === "delete") {
      setDialog({ kind: action, conversation: c });
      setEditValue(c.title);
      return;
    }
    const { error } = await supabase
      .from("ai_conversations")
      .update(
        action === "pin" ? { pinned: !c.pinned } : { archived: !c.archived },
      )
      .eq("id", c.id);
    if (!sessionScope.current.isCurrent(token)) return;
    if (error) {
      setError(friendlyError(error,locale));
      return;
    }
    try {
      await loadHistory();
    } catch (e) {
      if (!sessionScope.current.isCurrent(token)) return;
      setError(friendlyError(e,locale));
    }
  }
  async function applyDialog() {
    const token = sessionScope.current.capture();
    if (!dialog || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (dialog.kind === "edit" && dialog.message) {
        const index = messages.findIndex((m) => m.id === dialog.message!.id);
        const ids = messages.slice(index).map((m) => m.id);
        if (!temporary) {
          const result = await supabase
            .from("ai_messages")
            .delete()
            .in("id", ids);
          assertSession(token);
          if (result.error) throw result.error;
        }
        assertSession(token);
        if (audioPlayback && ids.includes(audioPlayback.messageId)) stopVoice();
        setMessages(messages.slice(0, index));
        setInput(editValue);
        setDialog(null);
        composer.current?.focus();
      } else if (dialog.conversation) {
        const c = dialog.conversation;
        let uploads: string[] = [];
        let generated: string[] = [];
        if (dialog.kind === "delete") {
          // Collect owner-scoped private objects BEFORE the cascade removes
          // their metadata. Never delete a path outside this authenticated user.
          const {
            data: { user },
          } = await supabase.auth.getUser();
          assertSession(token);
          if (!user) throw Error("auth expired");
          const capability = await fetch("/api/documents?capabilities=1").then(
            (r) => r.json(),
          );
          if (capability.retention) {
            const deleted = await fetch(
              "/api/documents?conversationId=" + encodeURIComponent(c.id),
              { method: "DELETE" },
            );
            if (!deleted.ok)
              throw Error(
                t("تعذّر حذف المستندات. المحادثة لم تُحذف؛ حاول مرة أخرى.","Documents could not be deleted. Your conversation was kept. Try again."),
              );
          }
          const [items, replyRows] = await Promise.all([
            supabase
              .from("ai_attachments")
              .select("storage_path")
              .eq("conversation_id", c.id)
              .limit(1000),
            supabase
              .from("ai_messages")
              .select("metadata")
              .eq("conversation_id", c.id)
              .limit(1000),
          ]);
          if (items.error || replyRows.error)
            throw items.error ?? replyRows.error;
          uploads = [
            ...new Set(
              (items.data ?? [])
                .map((x) => x.storage_path)
                .filter(
                  (p) => typeof p === "string" && p.startsWith(user.id + "/"),
                ),
            ),
          ];
          generated = [
            ...new Set(
              (replyRows.data ?? [])
                .map(
                  (x) =>
                    (x.metadata as Record<string, unknown> | null)?.assetPath,
                )
                .filter(
                  (p): p is string =>
                    typeof p === "string" && p.startsWith(user.id + "/"),
                ),
            ),
          ];
        }
        const result =
          dialog.kind === "delete"
            ? await supabase.from("ai_conversations").delete().eq("id", c.id)
            : await supabase
                .from("ai_conversations")
                .update({ title: editValue.trim().slice(0, 80) })
                .eq("id", c.id);
        assertSession(token);
        if (result.error) throw result.error;
        if (dialog.kind === "delete") {
          const [uploadsResult, generatedResult] = await Promise.all([
            uploads.length
              ? supabase.storage.from("noata-uploads").remove(uploads)
              : Promise.resolve({ error: null }),
            generated.length
              ? supabase.storage.from("noata-generated").remove(generated)
              : Promise.resolve({ error: null }),
          ]);
          if (uploadsResult.error || generatedResult.error)
            setNotice(
              t("تم حذف المحادثة، لكن تعذّر إزالة بعض الملفات. راجع إعدادات بياناتك.","Conversation deleted, but some files could not be removed. Check your data settings."),
            );
        }
        if (dialog.kind === "delete" && activeId === c.id) {
          stopVoice();
          setActiveId(null);
          setMessages([]);
          window.history.replaceState(null, "", "/ai");
        }
        await loadHistory();
        setDialog(null);
      }
    } catch (e) {
      if (!sessionScope.current.isCurrent(token)) return;
      setError(friendlyError(e,locale));
    } finally {
      if (!sessionScope.current.isCurrent(token)) return;
      lock.current = false;
      setBusy(false);
    }
  }
  function selectFile(file: File | undefined) {
    if (!file || lock.current) return;
    const invalid = validateAttachment(file,locale);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (file.type.startsWith("audio/")) {
      void transcribe(file);
      return;
    }
    if (isSupportedDocument(file)) {
      const proposed = [...documentFiles, file];
      const rejected = validateDocumentBatch(proposed,locale);
      if (rejected) {
        setError(rejected);
        return;
      }
      setDocumentFiles(proposed);
    } else {
      // Backend supports one vision image per request at present.
      setAttachment(file);
    }
    setError("");
  }
  function selectFiles(files: FileList | File[] | null | undefined) {
    if (!files || lock.current || loading) return;
    const incoming = Array.from(files);
    const documents = incoming.filter(isSupportedDocument);
    const others = incoming.filter((f) => !isSupportedDocument(f));
    const next = [...documentFiles, ...documents];
    const bad = validateDocumentBatch(next,locale);
    if (bad) {
      setError(bad);
      return;
    }
    if (
      others.length > 1 ||
      (others.length && others[0].type.startsWith("audio/") && documents.length)
    ) {
      setError(t("المسموح صورة واحدة مع عدة مستندات، أو ملف صوت منفصل للتفريغ.","Attach one image with multiple documents, or a separate audio file for transcription."));
      return;
    }
    if (others.length) {
      const error = validateAttachment(others[0],locale);
      if (error) {
        setError(error);
        return;
      }
    }
    setDocumentFiles(next);
    if (others.length) {
      if (others[0].type.startsWith("audio/")) void transcribe(others[0]);
      else setAttachment(others[0]);
    }
    setError("");
  }
  async function captureScreen() {
    const token = sessionScope.current.capture();
    let capture: MediaStream | undefined;
    if (lock.current || busy) return;
    if (!signedIn) {
      setError(t("سجّل الدخول علشان ترفق لقطة شاشة.","Sign in to attach a screenshot."));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      capture = stream;
      if (!sessionScope.current.isCurrent(token)) return;
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw Error("screen capture unavailable");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png", 0.92),
      );
      assertSession(token);
      if (!blob) throw Error("screen capture unavailable");
      selectFile(
        new File([blob], "screen-" + Date.now() + ".png", {
          type: "image/png",
        }),
      );
      setNotice(t("تم التقاط الشاشة. اكتب سؤالك ثم أرسل.","Screenshot captured. Write your question, then send it."));
      composer.current?.focus();
    } catch (e) {
      if (!sessionScope.current.isCurrent(token)) return;
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setNotice(t("تم إلغاء مشاركة الشاشة.","Screen sharing cancelled."));
      } else {
        setError(t("تعذّر التقاط الشاشة. جرّب رفع صورة بدلًا منها.","Could not capture the screen. Try uploading an image."));
      }
    } finally {
      capture?.getTracks().forEach((t) => t.stop());
    }
  }
  async function transcribe(file: File) {
    if (lock.current) return;
    const token = sessionScope.current.capture();
    lock.current = true;
    setBusy(true);
    setError("");
    abort.current = new AbortController();
    let uploadedAudioPath: string | undefined;
    try {
      const path = await upload(file, activeId ?? "temporary", token);
      uploadedAudioPath = path;
      assertSession(token);
      const data = await invoke({
        action: "transcribe_storage",
        model: sttModel,
        attachmentPath: path,
        filename: file.name,
      });
      assertSession(token);
      const text = String(data.result?.text ?? data.result?.transcript ?? "");
      if (!text) throw Error("Empty transcript");
      setInput((x) => (x ? x + " " + text : text));
      setNotice(t("راجع النص قبل إرساله.","Review the transcript before sending."));
      composer.current?.focus();
    } catch (e) {
      if (!sessionScope.current.isCurrent(token)) return;
      setError(friendlyError(e,locale));
    } finally {
      if (!sessionScope.current.isCurrent(token)) return;
      if (uploadedAudioPath) {
        const [storage, index] = await Promise.all([
          supabase.storage.from("noata-uploads").remove([uploadedAudioPath]),
          supabase
            .from("ai_attachments")
            .delete()
            .eq("storage_path", uploadedAudioPath),
        ]);
        if (storage.error || index.error) {
          setError(t("تعذّر تنظيف التسجيل الصوتي المؤقت. راجع إعدادات الملفات.","Temporary recording cleanup failed. Check your file settings."));
        }
      }
      lock.current = false;
      setBusy(false);
      abort.current = null;
    }
  }
  async function toggleRecording() {
    const token = sessionScope.current.capture();
    if (recording) {
      media.current?.stop();
      return;
    }
    if (!signedIn) {
      setError(t("سجّل الدخول علشان تستخدم الصوت.","Sign in to use voice."));
      return;
    }
    try {
      cancelRecording.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!sessionScope.current.isCurrent(token)) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const recorder = new MediaRecorder(stream);
      media.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (!sessionScope.current.isCurrent(token)) return;
        setRecording(false);
        if (!cancelRecording.current) {
          const type = recorder.mimeType || "audio/webm";
          void transcribe(
            new File(
              chunks,
              type.includes("mp4") ? "voice.mp4" : "voice.webm",
              { type },
            ),
          );
        }
      };
      recorder.start();
      setRecording(true);
    } catch {
      setError(
        t("السماح للميكروفون مطلوب. افتح إعدادات المتصفح أو ارفع ملفًا صوتيًا.","Microphone permission is needed. Check browser settings or upload an audio file."),
      );
    }
  }
  async function readAloud(text: string, messageId: string) {
    // A voice response belongs to a specific message. Discard async results
    // from a different chat, an edited message, or a closed player.
    stopVoice();
    const sequence = voiceGeneration.current.begin();
    const conversationId = activeId;
    setVoiceBusy(true);
    setVoiceRequestMessageId(messageId);
    setError("");
    try {
      const { data, error } = await supabase.functions.invoke(AI_FUNCTION, {
        body: {
          action: "tts",
          model: ttsModel,
          requestId: crypto.randomUUID(),
          input: text,
          voice: "Amelia",
          response_format: "mp3",
        },
        timeout: 180000,
      });
      if (!voiceGeneration.current.isCurrent(sequence)) return;
      if (error || data?.error) throw error ?? Error(String(data.error));
      const audioUrl = safeStorageLink(data?.asset?.signedUrl, SUPABASE_URL, "noata-generated");
      if (!audioUrl) throw Error("No authorized audio");
      setAudioPlayback({
        messageId,
        conversationId,
        url: audioUrl,
      });
    } catch (e) {
      if (voiceGeneration.current.isCurrent(sequence))
        setError(friendlyError(e,locale));
    } finally {
      if (voiceGeneration.current.isCurrent(sequence)) {
        setVoiceBusy(false);
        setVoiceRequestMessageId(null);
      }
    }
  }
  async function savePreferences() {
    const token = sessionScope.current.capture();
    if (!signedIn) {
      setError(t("سجّل الدخول علشان نحفظ تفضيلاتك.","Sign in to save your preferences."));
      return false;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      assertSession(token);
      if (!user) throw Error("auth expired");
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          default_ai_model: model,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      assertSession(token);
      if (error) throw error;
      setNotice(t("تم حفظ تفضيلات Noata AI.","Noata AI preferences saved."));
      return true;
    } catch (e) {
      if (!sessionScope.current.isCurrent(token)) return false;
      setError(friendlyError(e,locale));
      return false;
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(t("تم النسخ.","Copied."));
    } catch {
      setNotice(t("تعذّر النسخ التلقائي. حدّد النص وانسخه يدويًا.","Could not copy automatically. Select and copy the text manually."));
    }
  }
  const filtered = conversations.filter(
    (c) =>
      c.archived === archiveView &&
      c.title.toLowerCase().includes(historyQuery.toLowerCase()),
  );
  const historyProps = {
    rows: filtered,
    activeId,
    query: historyQuery,
    onQuery: setHistoryQuery,
    onOpen: (id: string) => void openConversation(id),
    onNew: () => newChat(),
    onAction: (c: Conversation, a: "pin" | "archive" | "rename" | "delete") =>
      void historyAction(c, a),
    busy,
    archived: archiveView,
    onArchiveView: () => setArchiveView((x) => !x),
    temporary,
    onTemporary: () => newChat(!temporary),
  };
  return {
    prepareRevision,clearRevision,revisionName,
    historyProps,
    sessionVersion,
    newChatEpoch,
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
    documentFiles,
    setDocumentFiles,
    selectFiles,
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
    setError,
    sttModel,
    setSttModel,
    ttsModel,
    setTtsModel,
  };
}
