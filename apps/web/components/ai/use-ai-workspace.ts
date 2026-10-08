"use client";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { createVoiceGenerationGuard } from "@/lib/ai/voice-generation";
import { isTextDocument, extractTextDocument } from "@/lib/ai/document-text";
import { isDocxDocument, extractDocxDocument } from "@/lib/ai/docx-ingest";
import {retainOriginalDocuments,deleteOriginalDocuments,clearOriginalDocuments} from "@/lib/ai/original-documents";
import { createAiMessageContext } from "@/lib/ai/context-budget";
import { isSupportedDocument,validateDocumentBatch,extractDocumentBatch } from "@/lib/ai/multi-document";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";
import {
  AI_FUNCTION,
  titleFrom,
  validateAttachment,
  parseStreamFrames,
  friendlyError,
  type Conversation,
  type Message,
} from "@/lib/ai/workspace";
const columns =
  "id,conversation_id,role,content,model,status,created_at,metadata";
/** Never leave the AI workspace showing an endless loading screen when Auth is offline. */
async function sessionStep<T>(work: PromiseLike<T>, timeoutMs = 6500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve(work),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("AI session initialization timed out")), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
export function useAIWorkspace() {
  const supabase = useMemo(() => createClient(), []);
  const [conversations, setConversations] = useState<Conversation[]>([]),
    [activeId, setActiveId] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([]);
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
  const [documentFiles,setDocumentFiles] = useState<File[]>([]);
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
    [voiceRequestMessageId, setVoiceRequestMessageId] = useState<string | null>(null);
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
  const failedTool = useRef<string | undefined>(undefined);
  const [sttModel, setSttModel] = useState("Fanar-Aura-STT-1");
  const [ttsModel, setTtsModel] = useState("Fanar-Aura-TTS-2");
  const loadHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("id,title,pinned,archived,selected_model,updated_at,temporary")
      .eq("temporary", false)
      .order("pinned", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    setConversations((data ?? []) as Conversation[]);
  }, [supabase]);
  useEffect(() => {
    let alive = true;
    const {data:{subscription}}=supabase.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT")clearOriginalDocuments();});
    void (async () => {
      try {
        const {
          data: { user },
        } = await sessionStep(supabase.auth.getUser());
        if (!alive) return;
        setSignedIn(Boolean(user));
        const prompt = new URLSearchParams(window.location.search).get(
          "prompt",
        );
        if (prompt) setInput(prompt.slice(0, 4000));
        if (user) {
          const { data } = await sessionStep(supabase
            .from("user_settings")
            .select("default_ai_model,ai_memory_enabled")
            .eq("user_id", user.id)
            .maybeSingle());
          if (data) {
            setModel(data.default_ai_model || "auto");
            setTemporary(!data.ai_memory_enabled);
          }
          await sessionStep(loadHistory());
        }
      } catch (e) {
        if (alive) {
          setSignedIn(false);
          setError("تعذّر التحقق من الجلسة حاليًا. يمكنك مراجعة الواجهة؛ أعد فتح الصفحة عندما يعود الاتصال.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      subscription.unsubscribe();
      alive = false;
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
  async function openConversation(id: string) {
    if (lock.current) return;
    stopVoice();
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
          if (message.role === "user" && typeof meta?.attachmentPath === "string") {
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
                content: "![صورة أنشأها Noata](" + signed.data.signedUrl + ")",
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
      setAttachment(null);
      setInput("");
      follow.current = true;
      window.history.replaceState(
        null,
        "",
        "/ai?chat=" + encodeURIComponent(id),
      );
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (loading || activeId || !conversations.length) return;
    const id = new URLSearchParams(window.location.search).get("chat");
    if (id && conversations.some((c) => c.id === id)) void openConversation(id);
  }, [conversations, loading, activeId]);
  function newChat(temp = temporary) {
    if (lock.current) return;
    stopVoice();
    setDocumentFiles([]);
    setAttachment(null);
    ++openSequence.current;
    setActiveId(null);
    setMessages([]);
    setPendingText("");
    failedTool.current = undefined;
    setInput("");
    setError("");
    setNotice("");
    setAttachment(null);
    setTemporary(temp);
    setMobileHistory(false);
    window.history.replaceState(null, "", "/ai");
    composer.current?.focus();
  }
  async function ensureConversation(text: string) {
    if (activeId) return activeId;
    if (temporary) return "temporary";
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw Error("auth expired");
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        title: titleFrom(text),
        selected_model: model,
        temporary: false,
      })
      .select("id")
      .single();
    if (error || !data) throw error ?? Error("save failed");
    setActiveId(data.id);
    window.history.replaceState(null, "", "/ai?chat=" + data.id);
    return data.id;
  }
  async function upload(file: File, conversationId: string) {
    const invalid = validateAttachment(file);
    if (invalid) throw Error(invalid);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw Error("auth expired");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-70);
    const path =
      user.id + "/" + conversationId + "/" + crypto.randomUUID() + "-" + safe;
    const { error } = await supabase.storage
      .from("noata-uploads")
      .upload(path, file, { contentType: file.type || "text/plain", upsert: false });
    if (error) throw error;
    const record = await supabase.from("ai_attachments").insert({
      user_id: user.id,
      conversation_id: conversationId === "temporary" ? null : conversationId,
      storage_path: path,
      mime_type: file.type,
      size_bytes: file.size,
    });
    if (record.error) {
      await supabase.storage.from("noata-uploads").remove([path]);
      throw record.error;
    }
    return path;
  }
  async function invoke(payload: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke(AI_FUNCTION, {
      body: { ...payload, requestId: crypto.randomUUID() },
      signal: abort.current?.signal,
      timeout: 180000,
    });
    if (error) throw error;
    if (data?.error) throw Error(String(data.error));
    return data;
  }
  async function chat(history: Message[], attachmentPath?: string) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw Error("auth expired");
    const response = await fetch(
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
          model,
          messages: createAiMessageContext(history),
          attachmentPath,
          stream: true,
          requestId: crypto.randomUUID(),
        }),
        signal: AbortSignal.any([
          abort.current!.signal,
          AbortSignal.timeout(180000),
        ]),
      },
    );
    if (!response.ok) throw Error(String(response.status));
    if (!response.headers.get("content-type")?.includes("text/event-stream")) {
      const data = await response.json();
      if (data.error) throw Error(String(data.error));
      if (!data.content) throw Error("Empty response");
      return {
        content: String(data.content),
        model: String(data.model ?? model),
      };
    }
    const reader = response.body!.getReader(),
      decoder = new TextDecoder();
    let buffer = "",
      content = "",
      used = model,
      done = false;
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        const parsed = parseStreamFrames(buffer);
        buffer = parsed.rest;
        for (const frame of parsed.data) {
          const event = JSON.parse(frame);
          if (event.error) throw Error(event.error);
          if (typeof event.content === "string") {
            content = event.content;
            setPendingText(content);
          }
          if (event.model) used = event.model;
          if (event.done) done = true;
        }
      }
    } finally {
      reader.releaseLock();
    }
    if (!done) throw Error("Stream interrupted");
    if (!content.trim()) throw Error("Empty response");
    return { content, model: used };
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
  ) {
    e?.preventDefault();
    if (lock.current || recording) return;
    if ((attachment || documentFiles.length>0) && (tool || mode !== "send")) {
      setError("المرفقات الجديدة تدعم الرسالة العادية فقط. أرسل الملفات أولًا قبل استخدام الأدوات أو إعادة توليد رد.");
      return;
    }
    if (!signedIn) {
      window.location.href = "/login?next=/ai";
      return;
    }
    const text =
      mode === "continue"
        ? "كمّل شرحك من النقطة اللي وقفت عندها."
        : mode === "retry"
          ? (messages.at(-1)?.content ?? "")
          : input.trim() || (documentFiles.length>0 || attachment && (isTextDocument(attachment)||isDocxDocument(attachment)) ? "قارن الملفات المرفقة واشرح ما يدعمه كل مصدر، مع الاستشهاد بأسماء الملفات." : attachment?.type.startsWith("image/") ? "حلّل الصورة المرفقة." : "");
    if (mode === "retry") tool = failedTool.current;
    else failedTool.current = tool;
    if (mode === "send" && !text) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setPendingText("");
    follow.current = true;
    abort.current = new AbortController();
    let history = messages;
    let conversationId = activeId ?? "temporary";
    let assistant: Message | undefined;
    let savedResponse = false;
    let temporaryUploadPath: string | undefined;
    let retainedDocumentIds:string[]=[];
    let sourcesSaved=false;
    try {
      conversationId = await ensureConversation(
        text || messages[0]?.content || "محادثة",
      );
      if (mode === "regenerate") {
        history = messages.slice(0, -1);
      }
      let path: string | undefined;
      let documentExcerpt: string | undefined;
      let documentTruncated = false;
      const documentSources = documentFiles.length
        ? await extractDocumentBatch(documentFiles,text)
        : [];
      if(documentSources.length){
        setNotice(temporary?"بنقرأ مستنداتك دون حفظ الأصل…":"بنجهّز المستندات الأصلية…");
        retainedDocumentIds=await retainOriginalDocuments(documentSources,documentFiles,conversationId,temporary,abort.current?.signal);
        if(!temporary && !retainedDocumentIds.length)setNotice("حفظ الأصل غير مفعّل؛ المعاينة الكاملة متاحة خلال جلسة الرفع فقط.");
      }
      if (attachment) {
        if (isTextDocument(attachment) || isDocxDocument(attachment)) {
          setNotice("بنقرأ محتوى المستند…");
          const extracted = isDocxDocument(attachment)
            ? await extractDocxDocument(attachment)
            : await extractTextDocument(attachment);
          documentExcerpt = extracted.excerpt;
          documentTruncated = extracted.truncated;
          // Private upload bucket currently only accepts image/audio.
          // Preserve a bounded, RLS-protected text excerpt in message metadata;
          // never mislabel it as a stored original file.
          setNotice("بنجهّز النص للمحادثة…");
        } else {
          setNotice("بنرفع الملف…");
          path = await upload(attachment, conversationId);
          if (temporary) temporaryUploadPath = path;
        }
        setNotice("");
      }
      if (mode === "send" || mode === "continue") {
        const row: Message = {
          id: crypto.randomUUID(),
          conversation_id: conversationId,
          role: "user",
          content: text,
          metadata: {
            ...(attachment ? {
              ...(path ? { attachmentPath: path } : {}),
              attachmentName: attachment.name,
              attachmentMime: attachment.type || "text/plain",
              ...(documentExcerpt ? {documentExcerpt,documentTruncated}:{}),
            } : {}),
            ...(documentSources.length ? {documentSources} : {}),
          },
          model: null,
          status: "complete",
          created_at: new Date().toISOString(),
        };
        const saved = await persist(row);
        sourcesSaved=true;
        if (path && attachment) {
          const signed = await supabase.storage
            .from("noata-uploads")
            .createSignedUrl(path, 3600);
          saved.metadata = {
            ...(saved.metadata ?? {}),
            attachmentUrl: signed.data?.signedUrl ?? null,
          };
        }
        history = [...history, saved];
        setMessages(history);
        setInput("");
      }
      let result: { content: string; model: string };
      let metadata: Record<string, unknown> = {};
      if (tool) {
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
        if (tool === "image" && data.asset?.path)
          metadata.assetPath = data.asset.path;
        const content =
          tool === "image"
            ? data.asset?.signedUrl
              ? "![صورة أنشأها Noata](" + data.asset.signedUrl + ")"
              : ""
            : String(
                data.result?.translation ??
                  data.result?.poem ??
                  data.result?.text ??
                  data.result?.content ??
                  JSON.stringify(data.result, null, 2),
              );
        if (!content) throw Error("No output");
        result = { content, model: tool };
      } else result = await chat(history, attachment && (isTextDocument(attachment)||isDocxDocument(attachment)) ? undefined : path);
      assistant = {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: "assistant",
        content: result.content,
        metadata,
        model: result.model,
        status: "complete",
        created_at: new Date().toISOString(),
      };
      if (mode === "regenerate" && !temporary) {
        const old = messages.at(-1)!;
        const { data, error } = await supabase
          .from("ai_messages")
          .update({
            content: result.content,
            model: result.model,
            status: "complete",
          })
          .eq("id", old.id)
          .select(columns)
          .single();
        if (error) throw error;
        assistant = data as Message;
      } else assistant = await persist(assistant);
      setMessages([...history, assistant]);
      savedResponse = true;
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
      setError(friendlyError(e));
      if (assistant && !savedResponse) {
        setPendingText(assistant.content);
        setNotice("الرد ظاهر هنا، لكن حفظه لم يتأكد. انسخه قبل مغادرة الصفحة.");
      }
    } finally {
      setBusy(false);
      lock.current = false;
      abort.current = null;
      if (savedResponse) setPendingText("");
      if(!sourcesSaved && retainedDocumentIds.length){try{await deleteOriginalDocuments(retainedDocumentIds);}catch{setError("تعذّر تنظيف المستندات بعد فشل حفظ الرسالة. حاول حذفها من المحادثة.");}}
      if (temporaryUploadPath) {
        // Temporary images are used for inference then erased from Storage
        // and the attachment index, even if inference fails.
        const [storageResult, recordResult] = await Promise.all([
          supabase.storage.from("noata-uploads").remove([temporaryUploadPath]),
          supabase.from("ai_attachments").delete().eq("storage_path", temporaryUploadPath),
        ]);
        if (storageResult.error || recordResult.error) {
          setError("تعذّر تنظيف المرفق المؤقت بالكامل. جرّب حذف البيانات المؤقتة من إعدادات الحساب.");
        }
      }
    }
  }
  async function historyAction(
    c: Conversation,
    action: "pin" | "archive" | "rename" | "delete",
  ) {
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
    if (error) {
      setError(friendlyError(error));
      return;
    }
    try {
      await loadHistory();
    } catch (e) {
      setError(friendlyError(e));
    }
  }
  async function applyDialog() {
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
          if (result.error) throw result.error;
        }
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
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw Error("auth expired");
          const capability=await fetch("/api/documents?capabilities=1").then(r=>r.json());
          if(capability.retention){const deleted=await fetch("/api/documents?conversationId="+encodeURIComponent(c.id),{method:"DELETE"});if(!deleted.ok)throw Error("تعذّر حذف المستندات. المحادثة لم تُحذف؛ حاول مرة أخرى.");}
          const [items, replyRows] = await Promise.all([
            supabase.from("ai_attachments").select("storage_path").eq("conversation_id", c.id).limit(1000),
            supabase.from("ai_messages").select("metadata").eq("conversation_id", c.id).limit(1000),
          ]);
          if (items.error || replyRows.error) throw items.error ?? replyRows.error;
          uploads = [...new Set((items.data ?? [])
            .map(x => x.storage_path)
            .filter(p => typeof p === "string" && p.startsWith(user.id + "/")))];
          generated = [...new Set((replyRows.data ?? [])
            .map(x => (x.metadata as Record<string, unknown> | null)?.assetPath)
            .filter((p): p is string => typeof p === "string" && p.startsWith(user.id + "/")))];
        }
        const result =
          dialog.kind === "delete"
            ? await supabase.from("ai_conversations").delete().eq("id", c.id)
            : await supabase
                .from("ai_conversations")
                .update({ title: editValue.trim().slice(0, 80) })
                .eq("id", c.id);
        if (result.error) throw result.error;
        if (dialog.kind === "delete") {
          const [uploadsResult, generatedResult] = await Promise.all([
            uploads.length ? supabase.storage.from("noata-uploads").remove(uploads) : Promise.resolve({error:null}),
            generated.length ? supabase.storage.from("noata-generated").remove(generated) : Promise.resolve({error:null}),
          ]);
          if (uploadsResult.error || generatedResult.error)
            setNotice("تم حذف المحادثة، لكن تعذّر إزالة بعض الملفات. راجع إعدادات بياناتك.");
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
      setError(friendlyError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function selectFile(file: File | undefined) {
    if (!file || lock.current) return;
    const invalid = validateAttachment(file);
    if (invalid) {setError(invalid);return;}
    if (file.type.startsWith("audio/")) {void transcribe(file);return;}
    if (isSupportedDocument(file)) {
      const proposed=[...documentFiles,file];
      const rejected=validateDocumentBatch(proposed);
      if(rejected){setError(rejected);return;}
      setDocumentFiles(proposed);
    }else{
      // Backend supports one vision image per request at present.
      setAttachment(file);
    }
    setError("");
  }
  function selectFiles(files:FileList|File[]|null|undefined){
    if(!files||lock.current)return;
    const incoming=Array.from(files);
    const documents=incoming.filter(isSupportedDocument);
    const others=incoming.filter(f=>!isSupportedDocument(f));
    const next=[...documentFiles,...documents];
    const bad=validateDocumentBatch(next);
    if(bad){setError(bad);return;}
    if(others.length>1 || (others.length && others[0].type.startsWith("audio/") && documents.length)){
      setError("المسموح صورة واحدة مع عدة مستندات، أو ملف صوت منفصل للتفريغ.");
      return;
    }
    if(others.length){
      const error=validateAttachment(others[0]);
      if(error){setError(error);return;}
    }
    setDocumentFiles(next);
    if(others.length){
      if(others[0].type.startsWith("audio/")) void transcribe(others[0]);
      else setAttachment(others[0]);
    }
    setError("");
  }
  async function captureScreen() {
    if (lock.current || busy) return;
    if (!signedIn) {
      setError("سجّل الدخول علشان ترفق لقطة شاشة.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
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
      if (!blob) throw Error("screen capture unavailable");
      selectFile(
        new File([blob], "screen-" + Date.now() + ".png", {
          type: "image/png",
        }),
      );
      setNotice("تم التقاط الشاشة. اكتب سؤالك ثم أرسل.");
      composer.current?.focus();
    } catch (e) {
      if (e instanceof DOMException && e.name === "NotAllowedError") {
        setNotice("تم إلغاء مشاركة الشاشة.");
      } else {
        setError("تعذّر التقاط الشاشة. جرّب رفع صورة بدلًا منها.");
      }
    }
  }
  async function transcribe(file: File) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    abort.current = new AbortController();
    let uploadedAudioPath: string | undefined;
    try {
      const path = await upload(file, activeId ?? "temporary");
      uploadedAudioPath = path;
      const data = await invoke({
        action: "transcribe_storage",
        model: sttModel,
        attachmentPath: path,
        filename: file.name,
      });
      const text = String(data.result?.text ?? data.result?.transcript ?? "");
      if (!text) throw Error("Empty transcript");
      setInput((x) => (x ? x + " " + text : text));
      setNotice("راجع النص قبل إرساله.");
      composer.current?.focus();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      if (uploadedAudioPath) {
        const [storage, index] = await Promise.all([
          supabase.storage.from("noata-uploads").remove([uploadedAudioPath]),
          supabase.from("ai_attachments").delete().eq("storage_path", uploadedAudioPath),
        ]);
        if (storage.error || index.error) {
          setError("تعذّر تنظيف التسجيل الصوتي المؤقت. راجع إعدادات الملفات.");
        }
      }
      lock.current = false;
      setBusy(false);
      abort.current = null;
    }
  }
  async function toggleRecording() {
    if (recording) {
      media.current?.stop();
      return;
    }
    if (!signedIn) {
      setError("سجّل الدخول علشان تستخدم الصوت.");
      return;
    }
    try {
      cancelRecording.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      media.current = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
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
        "السماح للميكروفون مطلوب. افتح إعدادات المتصفح أو ارفع ملفًا صوتيًا.",
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
      if (typeof data?.asset?.signedUrl !== "string") throw Error("No audio");
      setAudioPlayback({
        messageId,
        conversationId,
        url: data.asset.signedUrl,
      });
    } catch (e) {
      if (voiceGeneration.current.isCurrent(sequence)) setError(friendlyError(e));
    } finally {
      if (voiceGeneration.current.isCurrent(sequence)) {
        setVoiceBusy(false);
        setVoiceRequestMessageId(null);
      }
    }
  }
  async function savePreferences() {
    if (!signedIn) {
      setError("سجّل الدخول علشان نحفظ تفضيلاتك.");
      return false;
    }
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw Error("auth expired");
      const { error } = await supabase.from("user_settings").upsert(
        {
          user_id: user.id,
          default_ai_model: model,
          ai_memory_enabled: !temporary,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
      setNotice("تم حفظ تفضيلات Noata AI.");
      return true;
    } catch (e) {
      setError(friendlyError(e));
      return false;
    }
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("تم النسخ.");
    } catch {
      setNotice("تعذّر النسخ التلقائي. حدّد النص وانسخه يدويًا.");
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
