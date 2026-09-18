// AI Chat page: a separate, general-purpose multi-conversation study assistant. Distinct from the
// small lesson-grounded tutor widget in app.js (left untouched) — this is the 6th nav destination,
// with real conversation history, streaming, image attachments, and a Thinking/Normal mode toggle.
// See docs/DECISIONS.md for the architecture (NDJSON streaming protocol, two-phase write-queue
// design, client-side image resize, on-disk attachment persistence).
import { api, esc, id, lang, local, render, state, t, toast } from './app.js';
import { renderMarkdownToDOM } from './markdown.js';

const CHAT_HISTORY_WINDOW = 12;
const MAX_IMAGE_EDGE = 1600;
const MAX_ATTACHMENT_BYTES = 4_000_000;

const copy = {
  ar: {
    newChat: 'محادثة جديدة', search: 'ابحث في المحادثات…', pinned: 'مثبّتة', conversations: 'المحادثات',
    noConversations: 'لا توجد محادثات بعد', noResults: 'لا نتائج مطابقة', startHint: 'ابدأ محادثة جديدة من الأعلى.',
    welcomeTitle: 'أهلًا، بماذا أساعدك اليوم؟', welcomeBody: 'اسأل عن أي فكرة دراسية، اطلب شرحًا، أو ناقش مسألة خطوة بخطوة.',
    suggestion1: 'اشرح لي معنى السرعة المتوسطة بمثال', suggestion2: 'ساعدني أفهم رسم المسافة والزمن', suggestion3: 'كيف أراجع لاختبار الغد بذكاء؟',
    placeholder: 'اكتب رسالتك…', placeholderThinking: 'اسأل سؤالاً يحتاج تفكيرًا عميقًا…', send: 'إرسال', stop: 'إيقاف', thinking: 'تفكير عميق', reasoning: 'التفكير', reasoningHint: 'خطوات تفكير المساعد — ليست الإجابة النهائية.',
    attach: 'إرفاق ملف أو صورة', remove: 'إزالة', rename: 'إعادة تسمية', pin: 'تثبيت', unpin: 'إلغاء التثبيت', archive: 'أرشفة', unarchive: 'إلغاء الأرشفة', delete: 'حذف',
    confirmDeleteTitle: 'حذف المحادثة؟', confirmDeleteBody: 'سيتم حذف هذه المحادثة وكل رسائلها نهائيًا.', cancel: 'إلغاء', regenerate: 'إعادة توليد', copy: 'نسخ', copied: 'تم النسخ',
    edit: 'تعديل', save: 'حفظ', aiDraft: 'مسودة ذكاء اصطناعي', stopped: 'تم الإيقاف', unavailable: 'المساعد غير متاح الآن',
    imageRejected: 'الملفات غير الصورية غير مدعومة.', imageTooLarge: 'حجم الصورة كبير جدًا.', fileTooLarge: 'حجم الملف كبير جدًا (الحد الأقصى 2 ميجابايت).', fileReadFailed: 'تعذّرت قراءة الملف.', fileTypeRejected: 'نوع الملف غير مدعوم. يمكنك إرفاق صورة أو ملف نصي (txt, py, json, ...).', contextDivider: 'الرسائل الأقدم غير متاحة لذاكرة المساعد في هذا الرد.',
    ocrExtracting: 'جارٍ استخراج النص من الصورة…', ocrDone: 'تم استخراج النص من الصورة', ocrEmpty: 'لم يُعثر على نص مقروء في الصورة', ocrError: 'تعذّر استخراج النص من الصورة', ocrLoadFailed: 'تعذّر تحميل محرك قراءة النصوص',
    lightMode: 'وضع فاتح', darkMode: 'وضع داكن', you: 'أنت', assistant: 'المساعد', unavailableChip: 'الدردشة الذكية غير مفعّلة على هذه النسخة بعد.',
    dropHint: 'أفلت الصورة هنا', newMessages: 'رسائل جديدة',
  },
  en: {
    newChat: 'New chat', search: 'Search conversations…', pinned: 'Pinned', conversations: 'Conversations',
    noConversations: 'No conversations yet', noResults: 'No matching conversations', startHint: 'Start a new one above.',
    welcomeTitle: 'Hi — what can I help you with?', welcomeBody: 'Ask about any study topic, request an explanation, or work through a problem step by step.',
    suggestion1: 'Explain average speed with a worked example', suggestion2: 'Help me understand distance-time graphs', suggestion3: 'How should I revise for tomorrow’s test?',
    placeholder: 'Write your message…', placeholderThinking: 'Ask something that needs deep thinking…', send: 'Send', stop: 'Stop', thinking: 'Deep thinking', reasoning: 'Reasoning', reasoningHint: 'The assistant’s thinking steps — not the final answer.',
    attach: 'Attach a file or image', remove: 'Remove', rename: 'Rename', pin: 'Pin', unpin: 'Unpin', archive: 'Archive', unarchive: 'Unarchive', delete: 'Delete',
    confirmDeleteTitle: 'Delete this conversation?', confirmDeleteBody: 'This conversation and all its messages will be permanently deleted.', cancel: 'Cancel', regenerate: 'Regenerate', copy: 'Copy', copied: 'Copied',
    edit: 'Edit', save: 'Save', aiDraft: 'AI draft', stopped: 'Stopped', unavailable: 'The assistant is unavailable right now',
    imageRejected: 'Non-image files are not supported.', imageTooLarge: 'That image is too large.', fileTooLarge: 'That file is too large (2MB max).', fileReadFailed: 'Could not read that file.', fileTypeRejected: 'That file type isn’t supported. Attach an image or a text file (txt, py, json, ...).', contextDivider: 'Earlier messages aren’t included in the assistant’s memory for this reply.',
    ocrExtracting: 'Extracting text from image…', ocrDone: 'Text extracted from image', ocrEmpty: 'No readable text found in the image', ocrError: 'Could not extract text from the image', ocrLoadFailed: 'Could not load the text-reading engine',
    lightMode: 'Light mode', darkMode: 'Dark mode', you: 'You', assistant: 'Assistant', unavailableChip: 'AI Chat is not set up on this deployment yet.',
    dropHint: 'Drop image here', newMessages: 'New messages',
  },
};
const ct = (key) => copy[lang()]?.[key] || copy.ar[key] || key;

// A small custom line-icon set (original paths, not copied from any icon library) — the Chat page's
// own visual identity uses no emoji at all, unlike the rest of the app's Unicode-glyph icon system,
// since emoji render inconsistently across platforms and fonts. Every icon is a plain inline SVG,
// colored via currentColor so it inherits the button's text color/state automatically.
const ICONS = {
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  sun: '<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><path d="M12 2.5v3M12 18.5v3M4.4 4.4l2.1 2.1M17.5 17.5l2.1 2.1M2.5 12h3M18.5 12h3M4.4 19.6l2.1-2.1M17.5 6.5l2.1-2.1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  moon: '<path d="M20 14.3A8.4 8.4 0 1 1 9.7 4a7 7 0 0 0 10.3 10.3Z" fill="currentColor"/>',
  pin: '<path d="M12 2.5l1.85 5.7H20l-4.9 3.55L17 17.5 12 13.9 7 17.5l1.9-5.75L4 8.2h6.15Z" fill="currentColor"/>',
  pinOutline: '<path d="M12 2.5l1.85 5.7H20l-4.9 3.55L17 17.5 12 13.9 7 17.5l1.9-5.75L4 8.2h6.15Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
  edit: '<path d="M4 20l.9-4 11-11 3.1 3.1-11 11L4 20Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>',
  archive: '<rect x="3" y="4.5" width="18" height="3.6" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M5 9.3V18a1.3 1.3 0 0 0 1.3 1.3h11.4A1.3 1.3 0 0 0 19 18V9.3M10 13.2h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>',
  trash: '<path d="M5 7h14M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7m-7.3 0 .95 12.1a1 1 0 0 0 1 .9h5.7a1 1 0 0 0 1-.9L17.8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  spark: '<path d="M12 2.2c.7 4.1 2.7 6.1 6.8 6.8-4.1.7-6.1 2.7-6.8 6.8-.7-4.1-2.7-6.1-6.8-6.8 4.1-.7 6.1-2.7 6.8-6.8Z" fill="currentColor"/>',
  image: '<rect x="3" y="4.5" width="18" height="15" rx="2" stroke="currentColor" stroke-width="1.5"/><circle cx="8.7" cy="10" r="1.5" fill="currentColor"/><path d="M21 15.5l-5.4-5.3L6.5 19.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>',
  warning: '<path d="M12 3.3 21.3 19.5H2.7L12 3.3Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/><path d="M12 9.8v4M12 16.7h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
  check: '<path d="M4.5 12.5l5 5 10-11" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  refresh: '<path d="M4.5 12a7.5 7.5 0 0 1 12.6-5.5M19.5 12a7.5 7.5 0 0 1-12.6 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/><path d="M17.3 3.2v4h-4M6.7 20.8v-4h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
  attach: '<path d="M8 12.8V6.8a4 4 0 0 1 8 0v9.4a2.6 2.6 0 0 1-5.2 0V8.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/>',
  copy: '<rect x="4" y="4" width="12" height="12" rx="1.6" stroke="currentColor" stroke-width="1.5"/><path d="M9 20h7.4a1.6 1.6 0 0 0 1.6-1.6V9" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  send: '<path d="M3.2 11.3 19.7 4.3l-6.4 15.4-2.3-7-8-1.4Z" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linejoin="round"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="2.2" fill="currentColor"/>',
  search: '<circle cx="10.3" cy="10.3" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M14.8 14.8 19.5 19.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  file: '<path d="M6.5 3h7.2L18 6.8V20a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/><path d="M13.5 3v3.8H18M9 12.2h6M9 15.5h6M9 8.8h2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  dots: '<circle cx="4" cy="10" r="1.6" fill="currentColor"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/><circle cx="16" cy="10" r="1.6" fill="currentColor"/>',
  node: '<circle cx="12" cy="6" r="2.1" stroke="currentColor" stroke-width="1.6"/><circle cx="5.5" cy="17" r="2.1" stroke="currentColor" stroke-width="1.6"/><circle cx="18.5" cy="17" r="2.1" stroke="currentColor" stroke-width="1.6"/><path d="M12 8.1V12M12 12l-5.3 3.3M12 12l5.3 3.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  arrowDown: '<path d="M12 4v14.5M6 13l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
};
function icon(name, size = 16) {
  return `<svg class="chat-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

function loadChatTheme() {
  try { return localStorage.getItem('lp-chat-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}
function saveChatTheme(theme) {
  try { localStorage.setItem('lp-chat-theme', theme); } catch { /* private mode: preference won't persist */ }
}

const chatState = {
  initialized: false, loadingList: false, conversations: [], aiCapabilities: { chatAvailable: false, thinkingSupported: false },
  activeId: null, activeConversation: null, loadingConversation: false,
  search: '', sidebarOpen: window.innerWidth > 900,
  composerAttachment: null, attachmentError: null, thinkingMode: false,
  streaming: false, streamAbort: null, streamAssistantId: null, streamDomId: null, streamContent: '', streamThinking: '',
  editingMessageId: null, renamingId: null, confirmDeleteId: null, openMenuId: null, dragActive: false,
  theme: loadChatTheme(), scrolledUp: false,
};

// ---------------------------------------------------------------------------
// Networking
// ---------------------------------------------------------------------------

async function loadConversations() {
  chatState.loadingList = true;
  try {
    const result = await api('/api/chat/conversations');
    chatState.conversations = result.conversations;
    chatState.aiCapabilities = result.aiCapabilities;
  } catch (error) {
    toast(error.message, 'error');
  } finally {
    chatState.loadingList = false;
    chatState.initialized = true;
  }
}

async function openConversation(conversationId) {
  chatState.activeId = conversationId;
  chatState.loadingConversation = true;
  chatState.activeConversation = null;
  renderNow();
  try {
    const result = await api(`/api/chat/conversations/${conversationId}`);
    chatState.activeConversation = result.conversation;
  } catch (error) {
    toast(error.message, 'error');
    chatState.activeId = null;
  } finally {
    chatState.loadingConversation = false;
    renderNow();
  }
}

async function createConversation() {
  try {
    const result = await api('/api/chat/conversations', { method: 'POST', body: JSON.stringify({}) });
    chatState.conversations.unshift({ id: result.conversation.id, title: null, pinned: false, archived: false, createdAt: result.conversation.createdAt, updatedAt: result.conversation.updatedAt, preview: '' });
    chatState.activeId = result.conversation.id;
    chatState.activeConversation = result.conversation;
    chatState.search = '';
    chatState.sidebarOpen = window.innerWidth > 900;
    renderNow();
    focusComposer();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function patchConversation(conversationId, patch) {
  try {
    const result = await api(`/api/chat/conversations/${conversationId}`, { method: 'PATCH', body: JSON.stringify(patch) });
    const summary = chatState.conversations.find((item) => item.id === conversationId);
    if (summary) Object.assign(summary, { title: result.conversation.title, pinned: result.conversation.pinned, archived: result.conversation.archived, updatedAt: result.conversation.updatedAt });
    if (chatState.activeConversation?.id === conversationId) chatState.activeConversation = { ...chatState.activeConversation, ...result.conversation };
    renderNow();
  } catch (error) {
    toast(error.message, 'error');
  }
}

async function deleteConversation(conversationId) {
  try {
    await api(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
    chatState.conversations = chatState.conversations.filter((item) => item.id !== conversationId);
    if (chatState.activeId === conversationId) { chatState.activeId = null; chatState.activeConversation = null; }
    chatState.confirmDeleteId = null;
    renderNow();
    toast(lang() === 'en' ? 'Conversation deleted.' : 'تم حذف المحادثة.');
  } catch (error) {
    toast(error.message, 'error');
  }
}

// ---------------------------------------------------------------------------
// Client-side image resize (canvas) — see Correction 4: predictable payload size regardless of the
// original photo's size, rather than relying on a raw upload cap alone.
// ---------------------------------------------------------------------------

function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read-failed'));
    reader.onload = () => { img.src = reader.result; };
    img.onerror = () => reject(new Error('decode-failed'));
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('encode-failed'));
        const blobReader = new FileReader();
        blobReader.onerror = () => reject(new Error('read-failed'));
        blobReader.onload = () => {
          const dataBase64 = String(blobReader.result).split(',')[1] || '';
          resolve({ kind: 'image', dataBase64, type: 'image/jpeg', name: file.name, size: blob.size, previewUrl: URL.createObjectURL(blob) });
        };
        blobReader.readAsDataURL(blob);
      }, 'image/jpeg', 0.85);
    };
    reader.readAsDataURL(file);
  });
}

// Plain-text-ish file types the assistant can genuinely read — extension-based, since browsers don't
// reliably report a useful MIME type for source files like .py (often empty or "application/x-python").
const TEXT_FILE_EXTENSIONS = ['.txt', '.md', '.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.csv', '.html', '.css', '.xml', '.yml', '.yaml', '.sh', '.log', '.c', '.cpp', '.java', '.rb', '.go', '.rs', '.sql'];
const MAX_TEXT_ATTACHMENT_CHARS = 20_000;

function isTextFile(file) {
  const name = file.name.toLowerCase();
  return TEXT_FILE_EXTENSIONS.some((ext) => name.endsWith(ext)) || file.type === 'text/plain';
}

async function attachTextFile(file) {
  chatState.attachmentError = null;
  if (file.size > 2_000_000) { chatState.attachmentError = ct('fileTooLarge'); renderNow(); return; }
  try {
    let text = await file.text();
    let truncated = false;
    if (text.length > MAX_TEXT_ATTACHMENT_CHARS) { text = text.slice(0, MAX_TEXT_ATTACHMENT_CHARS); truncated = true; }
    chatState.composerAttachment = { kind: 'text', name: file.name, content: text, size: file.size, truncated };
  } catch {
    chatState.attachmentError = ct('fileReadFailed');
  }
  renderNow();
}

async function attachFile(file) {
  if (isTextFile(file)) return attachTextFile(file);
  if (file.type.startsWith('image/')) return attachImageFile(file);
  chatState.attachmentError = ct('fileTypeRejected');
  renderNow();
}

async function attachImageFile(file) {
  chatState.attachmentError = null;
  if (file.size > MAX_ATTACHMENT_BYTES * 4) { chatState.attachmentError = ct('imageTooLarge'); renderNow(); return; }
  try {
    const resized = await resizeImageFile(file);
    resized.ocrStatus = 'pending';
    resized.ocrProgress = 0;
    resized.ocrText = '';
    chatState.composerAttachment = resized;
    renderNow();
    runOcr(resized);
  } catch {
    chatState.attachmentError = ct('imageTooLarge');
    renderNow();
  }
}

// ---------------------------------------------------------------------------
// Real client-side OCR (Tesseract.js, vendored under /public/vendor/tesseract — no CDN, this app has
// no external-script CSP allowance). The deployed Ollama model has no vision capability at all (verified
// against its published model card), so image attachments are never sent to it as image bytes: instead,
// the browser genuinely reads the text out of the photo before sending, and that extracted text — not
// the pixels — is what the assistant actually receives. A persistent worker recognizes both Arabic and
// English (the app's two supported languages) so a screenshot in either script works without asking the
// student which language their photo is in.
// ---------------------------------------------------------------------------

const TESSERACT_BASE = '/vendor/tesseract';
let tesseractScriptPromise = null;
let tesseractWorkerPromise = null;
let currentOcrProgressHandler = null;

function loadTesseractScript() {
  if (window.Tesseract) return Promise.resolve();
  if (!tesseractScriptPromise) {
    tesseractScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${TESSERACT_BASE}/tesseract.min.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('tesseract-load-failed'));
      document.head.appendChild(script);
    });
  }
  return tesseractScriptPromise;
}

function getTesseractWorker() {
  if (!tesseractWorkerPromise) {
    tesseractWorkerPromise = loadTesseractScript().then(() => window.Tesseract.createWorker(['ara', 'eng'], 1, {
      workerPath: `${TESSERACT_BASE}/worker.min.js`,
      corePath: `${TESSERACT_BASE}/tesseract-core-simd.wasm.js`,
      langPath: `${TESSERACT_BASE}/`,
      logger: (m) => { if (currentOcrProgressHandler && m.status === 'recognizing text') currentOcrProgressHandler(Math.round((m.progress || 0) * 100)); },
    })).catch((error) => { tesseractWorkerPromise = null; throw error; });
  }
  return tesseractWorkerPromise;
}

async function recognizeImageText(imageUrl, onProgress) {
  const worker = await getTesseractWorker();
  currentOcrProgressHandler = onProgress;
  try {
    const { data } = await worker.recognize(imageUrl);
    return (data?.text || '').trim();
  } finally {
    currentOcrProgressHandler = null;
  }
}

async function runOcr(attachment) {
  try {
    const text = await recognizeImageText(attachment.previewUrl, (progress) => {
      if (chatState.composerAttachment !== attachment) return;
      attachment.ocrProgress = progress;
      renderNow();
    });
    if (chatState.composerAttachment !== attachment) return;
    attachment.ocrStatus = 'done';
    attachment.ocrText = text.slice(0, MAX_TEXT_ATTACHMENT_CHARS);
  } catch {
    if (chatState.composerAttachment !== attachment) return;
    attachment.ocrStatus = 'error';
  }
  renderNow();
}

// ---------------------------------------------------------------------------
// Streaming send / stop / regenerate / edit-resubmit
// ---------------------------------------------------------------------------

function contextDividerIndexFor(conversation) {
  return conversation.messages.length > CHAT_HISTORY_WINDOW ? conversation.messages.length - CHAT_HISTORY_WINDOW : -1;
}

async function sendChat({ content = '', regenerate = false, editFromMessageId = null } = {}) {
  if (chatState.streaming || !chatState.activeConversation) return;
  const conversation = chatState.activeConversation;
  const attachment = chatState.composerAttachment;
  // Images are only ever handed to the assistant as OCR'd text (see runOcr) — sending before that
  // finishes would either block on nothing (no text yet) or silently drop the image's content.
  if (attachment?.kind === 'image' && attachment.ocrStatus === 'pending') return;
  const idempotencyKey = id();

  if (!regenerate) {
    if (editFromMessageId) {
      const cutIndex = conversation.messages.findIndex((message) => message.id === editFromMessageId);
      if (cutIndex >= 0) conversation.messages = conversation.messages.slice(0, cutIndex);
    }
    conversation.messages.push({
      id: `pending-${idempotencyKey}`, role: 'user', content,
      attachment: attachment ? (attachment.kind === 'text'
        ? { kind: 'text', name: attachment.name, size: attachment.size, truncated: attachment.truncated }
        : { kind: 'image', name: attachment.name, type: attachment.type, size: attachment.size, previewUrl: attachment.previewUrl }) : null,
      createdAt: new Date().toISOString(),
    });
  } else {
    const lastIndex = conversation.messages.length - 1;
    if (lastIndex >= 0 && conversation.messages[lastIndex].role === 'assistant') conversation.messages = conversation.messages.slice(0, lastIndex);
  }
  const willUseThinking = chatState.thinkingMode && chatState.aiCapabilities.thinkingSupported;
  const placeholderId = `pending-assistant-${idempotencyKey}`;
  conversation.messages.push({ id: placeholderId, role: 'assistant', content: '', thinking: '', status: 'generating', thinkingRequested: willUseThinking });

  chatState.composerAttachment = null;
  chatState.attachmentError = null;
  chatState.streaming = true;
  chatState.streamAssistantId = placeholderId;
  chatState.streamDomId = placeholderId;
  chatState.streamContent = '';
  chatState.streamThinking = '';
  chatState.scrolledUp = false;
  renderNow();
  scrollMessagesToBottom();

  const controller = new AbortController();
  chatState.streamAbort = controller;

  const body = { idempotencyKey, regenerate, editFromMessageId };
  if (!regenerate) body.content = content;
  if (attachment) {
    body.attachment = attachment.kind === 'text'
      ? { kind: 'text', name: attachment.name, content: attachment.content }
      : { kind: 'image', name: attachment.name, type: attachment.type, dataBase64: attachment.dataBase64, ocrText: attachment.ocrText || '' };
  }
  if (willUseThinking) body.thinking = true;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`, { method: 'POST', headers, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error?.message || (lang() === 'en' ? 'Something went wrong.' : 'حدث خطأ غير متوقع.'));
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let realAssistantId = placeholderId;
    let realUserId = null;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;
        let parsed;
        try { parsed = JSON.parse(line); } catch { continue; }
        if (parsed.type === 'meta') {
          realAssistantId = parsed.assistantMessageId;
          realUserId = parsed.userMessageId;
          const assistantMessage = conversation.messages.find((message) => message.id === placeholderId);
          if (assistantMessage) assistantMessage.id = realAssistantId;
          if (realUserId && !regenerate) {
            const pendingUser = conversation.messages.find((message) => message.id === `pending-${idempotencyKey}`);
            if (pendingUser) pendingUser.id = realUserId;
          }
          chatState.streamAssistantId = realAssistantId;
          if (!conversation.title && parsed.title) conversation.title = parsed.title;
        } else if (parsed.type === 'delta') {
          if (parsed.kind === 'thinking') chatState.streamThinking += parsed.text;
          else chatState.streamContent += parsed.text;
          updateStreamingBubbleDOM();
        } else if (parsed.type === 'done') {
          const assistantMessage = conversation.messages.find((message) => message.id === realAssistantId);
          if (assistantMessage) {
            assistantMessage.content = chatState.streamContent;
            assistantMessage.thinking = chatState.streamThinking;
            assistantMessage.status = parsed.stopped ? 'stopped' : 'complete';
            assistantMessage.aiGenerated = parsed.aiGenerated;
            assistantMessage.unavailable = parsed.unavailable;
            assistantMessage.stopped = parsed.stopped;
          }
        }
      }
    }
  } catch (error) {
    const assistantMessage = conversation.messages.find((message) => message.id === chatState.streamAssistantId || message.id === placeholderId);
    if (assistantMessage) {
      assistantMessage.content = chatState.streamContent || (error.name === 'AbortError' ? '' : error.message);
      assistantMessage.thinking = chatState.streamThinking;
      assistantMessage.status = error.name === 'AbortError' ? 'stopped' : 'complete';
      assistantMessage.stopped = error.name === 'AbortError';
      assistantMessage.unavailable = error.name !== 'AbortError';
      assistantMessage.aiGenerated = false;
    }
  } finally {
    chatState.streaming = false;
    chatState.streamAbort = null;
    chatState.streamAssistantId = null;
    chatState.streamDomId = null;
    const summary = chatState.conversations.find((item) => item.id === conversation.id);
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (summary) { summary.updatedAt = new Date().toISOString(); summary.title = conversation.title; summary.preview = String(lastMessage?.content || '').slice(0, 120); }
    reorderConversationSummaries();
    renderNow();
  }
}

function reorderConversationSummaries() {
  chatState.conversations.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.updatedAt.localeCompare(a.updatedAt));
}

function stopStreaming() {
  chatState.streamAbort?.abort();
}

// Hot-loop DOM update: plain text on EVERY delta the instant it arrives (cheap, always correct, never
// throttled — this is what makes the reply visibly start "talking" the moment the model responds,
// not after it finishes). Full Markdown formatting re-renders at most every ~140ms on top of that, so
// code blocks/bold/lists appear progressively without re-parsing on every single character.
let lastMarkdownRenderAt = 0;
function updateStreamingBubbleDOM() {
  // Deliberately the DOM id captured at send-time (streamDomId), NOT streamAssistantId — the latter
  // gets reassigned to the server's real message id once the `meta` line arrives, but the rendered
  // DOM element still carries the original placeholder id from the send-start render. Looking it up
  // by streamAssistantId after that point would silently find nothing for the rest of the stream
  // (this was the actual bug behind "the reply only appears once it's completely finished" — the
  // text was accumulating in state the whole time, just never reaching the DOM until the next full
  // re-render at stream-end happened to use the now-correct id).
  const msgId = chatState.streamDomId;
  const contentEl = document.getElementById(`chat-msg-content-${msgId}`);
  if (contentEl) { contentEl.textContent = chatState.streamContent; appendStreamCursor(contentEl); }
  const thinkingEl = document.getElementById(`chat-msg-thinking-${msgId}`);
  if (thinkingEl) thinkingEl.textContent = chatState.streamThinking;

  // The typing indicator and the reasoning panel's "thinking…" live indicator are static placeholders
  // from the last full render — hide them here as real text starts arriving, since the hot loop never
  // re-runs renderMessage() to recompute that itself. The reasoning panel ITSELF is already visible
  // from the first render whenever thinking was requested (see renderMessage/showReasoningBlock) —
  // this only needs to swap its live indicator for the real streamed text.
  if (chatState.streamContent || chatState.streamThinking) {
    const typingEl = document.getElementById(`chat-msg-typing-${msgId}`);
    if (typingEl) typingEl.style.display = 'none';
  }
  if (chatState.streamThinking) {
    const liveEl = document.getElementById(`chat-reasoning-live-${msgId}`);
    if (liveEl) liveEl.style.display = 'none';
  }
  // Swap the ambient bubble animation from the cooler "thinking" breathe to the warmer "answering"
  // one the moment real answer text (not just reasoning) starts arriving.
  if (chatState.streamContent) {
    const wrapperEl = document.querySelector(`[data-chat-msg="${msgId}"]`);
    if (wrapperEl && !wrapperEl.classList.contains('is-answering')) wrapperEl.classList.add('is-answering');
  }

  const now = performance.now();
  if (contentEl && now - lastMarkdownRenderAt > 140) {
    lastMarkdownRenderAt = now;
    contentEl.replaceChildren(renderMarkdownToDOM(chatState.streamContent));
    appendStreamCursor(contentEl);
  }
  if (!chatState.scrolledUp) scrollMessagesToBottom();
}

// A blinking cursor at the exact end of the live text — the clearest, most standard signal that a
// reply is actively being written (not stalled), sitting inline wherever the text currently wraps to
// rather than pinned to the bubble's corner. Re-appended after every DOM write since both textContent
// assignment and replaceChildren() above wipe any previous child, cursor included.
function appendStreamCursor(el) {
  const cursor = document.createElement('span');
  cursor.className = 'chat-stream-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  el.appendChild(cursor);
}

// ---------------------------------------------------------------------------
// Scroll handling: auto-scroll to new content unless the user has deliberately scrolled up.
// ---------------------------------------------------------------------------

function scrollMessagesToBottom() {
  const el = document.getElementById('chat-messages');
  if (el) el.scrollTop = el.scrollHeight;
}

function focusComposer() {
  document.getElementById('chat-composer-input')?.focus();
}

// A lightweight re-render used by streaming/network callbacks: re-invokes the app's normal render
// pipeline only when the Chat page is the active view (avoids clobbering another page's DOM if the
// user has already navigated away while a background request was in flight).
function renderNow() {
  if (state.view === 'chat') render();
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderChatPage() {
  if (!chatState.initialized && !chatState.loadingList) loadConversations().then(renderNow);
  const html = `
    <div class="chat-page" data-theme="${chatState.theme}">
      ${renderSidebar()}
      <div class="chat-sidebar-backdrop ${chatState.sidebarOpen ? 'visible' : ''}" data-chat-action="close-sidebar"></div>
      <div class="chat-main">
        ${chatState.activeConversation && chatState.activeConversation.messages.length > 0 ? renderConversationBody() : renderChatWelcome()}
      </div>
    </div>`;
  queueMicrotask(() => { hydrateChatMessages(); if (chatState.activeConversation && !chatState.scrolledUp) scrollMessagesToBottom(); });
  return html;
}

// renderMessage() emits an empty content element for each assistant message (Markdown produces real
// DOM nodes, which cannot be embedded in an HTML template string). After every full render, this
// walks those placeholders and fills them in — except the one currently owned by the streaming hot
// loop (updateStreamingBubbleDOM), which this must not fight with mid-stream.
function hydrateChatMessages() {
  const conversation = chatState.activeConversation;
  if (!conversation) return;
  for (const message of conversation.messages) {
    if (message.role !== 'assistant' || !message.content) continue;
    if (chatState.streaming && message.id === chatState.streamAssistantId) continue;
    const contentEl = document.getElementById(`chat-msg-content-${message.id}`);
    if (contentEl) contentEl.replaceChildren(renderMarkdownToDOM(message.content));
  }
}

function renderSidebar() {
  const query = chatState.search.trim().toLowerCase();
  const visible = chatState.conversations.filter((item) => !item.archived && (!query || (item.title || '').toLowerCase().includes(query) || item.preview.toLowerCase().includes(query)));
  const pinned = visible.filter((item) => item.pinned);
  const rest = visible.filter((item) => !item.pinned);
  return `
    <aside class="chat-sidebar ${chatState.sidebarOpen ? 'open' : ''}">
      <div class="chat-sidebar-head">
        <button class="btn btn-primary btn-block chat-new-btn" data-chat-action="new-chat">${icon('plus', 15)}<span>${ct('newChat')}</span></button>
        <button class="icon-button chat-sidebar-close" data-chat-action="close-sidebar" aria-label="${lang() === 'en' ? 'Close' : 'إغلاق'}">${icon('close')}</button>
      </div>
      <div class="chat-search">${icon('search', 15)}<input type="search" id="chat-search-input" placeholder="${ct('search')}" value="${esc(chatState.search)}" aria-label="${ct('search')}"></div>
      <nav class="chat-conversation-list" aria-label="${ct('conversations')}">
        ${chatState.loadingList ? `<div class="chat-list-skeleton"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>` : ''}
        ${!chatState.loadingList && !visible.length ? `<p class="chat-empty-list">${query ? ct('noResults') : ct('noConversations')}</p>` : ''}
        ${pinned.length ? `<p class="chat-list-group">${ct('pinned')}</p>${pinned.map(renderConversationListItem).join('')}` : ''}
        ${rest.length ? `${pinned.length ? `<p class="chat-list-group">${ct('conversations')}</p>` : ''}${rest.map(renderConversationListItem).join('')}` : ''}
      </nav>
      <button class="chat-theme-toggle" data-chat-action="toggle-theme" aria-pressed="${chatState.theme === 'dark'}">
        ${chatState.theme === 'dark' ? icon('sun', 15) : icon('moon', 15)}<span>${chatState.theme === 'dark' ? ct('lightMode') : ct('darkMode')}</span>
      </button>
    </aside>
    ${chatState.confirmDeleteId ? renderDeleteConfirm() : ''}`;
}

function renderConversationListItem(item) {
  const active = item.id === chatState.activeId;
  const title = item.title || ct('newChat');
  const menuOpen = chatState.openMenuId === item.id;
  if (chatState.renamingId === item.id) {
    return `
      <div class="chat-conversation-item is-renaming">
        <form class="chat-rename-form" data-chat-rename-form="${item.id}"><input type="text" value="${esc(title)}" maxlength="80" autofocus id="chat-rename-input"></form>
      </div>`;
  }
  return `
    <div class="chat-conversation-item ${active ? 'active' : ''} ${menuOpen ? 'menu-open' : ''}" data-chat-open="${item.id}">
      <button class="chat-conversation-title" data-chat-open="${item.id}">
        ${item.pinned ? `<i class="chat-pin-mark" aria-hidden="true">${icon('pin', 11)}</i>` : ''}<span>${esc(title)}</span>
      </button>
      <div class="chat-conversation-actions">
        <button class="icon-button icon-button-sm" data-chat-action="pin" data-chat-id="${item.id}" aria-label="${item.pinned ? ct('unpin') : ct('pin')}" title="${item.pinned ? ct('unpin') : ct('pin')}">${item.pinned ? icon('pin', 14) : icon('pinOutline', 14)}</button>
        <div class="chat-kebab-wrap">
          <button class="icon-button icon-button-sm chat-kebab-btn" data-chat-action="toggle-menu" data-chat-id="${item.id}" aria-label="${lang() === 'en' ? 'More' : 'المزيد'}" aria-haspopup="true" aria-expanded="${menuOpen}">
            ${icon('dots', 14)}
          </button>
          ${menuOpen ? `
            <div class="chat-menu-dropdown" role="menu">
              <button role="menuitem" data-chat-action="rename" data-chat-id="${item.id}">${icon('edit', 14)}<span>${ct('rename')}</span></button>
              <button role="menuitem" data-chat-action="archive" data-chat-id="${item.id}">${icon('archive', 14)}<span>${item.archived ? ct('unarchive') : ct('archive')}</span></button>
              <button role="menuitem" class="chat-menu-danger" data-chat-action="delete" data-chat-id="${item.id}">${icon('trash', 14)}<span>${ct('delete')}</span></button>
            </div>` : ''}
        </div>
      </div>
    </div>`;
}

function renderDeleteConfirm() {
  return `
    <div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="chat-delete-title">
      <h2 id="chat-delete-title">${ct('confirmDeleteTitle')}</h2>
      <p>${ct('confirmDeleteBody')}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-chat-action="cancel-delete">${ct('cancel')}</button>
        <button class="btn btn-danger" data-chat-action="confirm-delete" data-chat-id="${chatState.confirmDeleteId}">${ct('delete')}</button>
      </div>
    </section></div>`;
}

function renderChatWelcome() {
  const available = chatState.aiCapabilities.chatAvailable;
  return `
    <button class="chat-menu-toggle" data-chat-action="open-sidebar" aria-label="${lang() === 'en' ? 'Conversations' : 'المحادثات'}">${icon('menu', 18)}</button>
    <div class="chat-welcome">
      <div class="chat-welcome-mark">${icon('spark', 26)}</div>
      <h1>${ct('welcomeTitle')}</h1>
      <p>${ct('welcomeBody')}</p>
      ${!available ? `<p class="chat-unavailable-chip">${ct('unavailableChip')}</p>` : ''}
      <div class="chat-suggestions">
        <button class="chat-suggestion" data-chat-suggest="${esc(ct('suggestion1'))}">${ct('suggestion1')}</button>
        <button class="chat-suggestion" data-chat-suggest="${esc(ct('suggestion2'))}">${ct('suggestion2')}</button>
        <button class="chat-suggestion" data-chat-suggest="${esc(ct('suggestion3'))}">${ct('suggestion3')}</button>
      </div>
      ${renderComposer(true)}
    </div>`;
}

function renderConversationBody() {
  const conversation = chatState.activeConversation;
  if (chatState.loadingConversation || !conversation) {
    return `<div class="chat-messages-loading"><div class="skeleton"></div><div class="skeleton"></div></div>`;
  }
  const dividerIndex = contextDividerIndexFor(conversation);
  return `
    <button class="chat-menu-toggle" data-chat-action="open-sidebar" aria-label="${lang() === 'en' ? 'Conversations' : 'المحادثات'}">${icon('menu', 18)}</button>
    <div class="chat-messages" id="chat-messages">
      ${conversation.messages.map((message, index) => `${index === dividerIndex ? `<div class="chat-context-divider"><span>${ct('contextDivider')}</span></div>` : ''}${renderMessage(message, conversation)}`).join('')}
    </div>
    <button class="chat-scroll-bottom ${chatState.scrolledUp ? 'visible' : ''}" data-chat-action="scroll-bottom">${icon('arrowDown', 13)}<span>${ct('newMessages')}</span></button>
    ${renderComposer(false)}`;
}

function renderMessage(message, conversation) {
  const isLast = conversation.messages[conversation.messages.length - 1]?.id === message.id;
  const newestClass = isLast ? 'chat-msg-newest' : '';
  if (message.role === 'user') {
    if (chatState.editingMessageId === message.id) {
      return `
        <div class="chat-msg chat-msg-user chat-msg-editing" data-chat-msg="${message.id}">
          <form class="chat-edit-form" data-chat-edit-form="${message.id}">
            <textarea id="chat-edit-textarea" maxlength="4000">${esc(message.content)}</textarea>
            <div class="chat-edit-actions"><button type="button" class="btn btn-ghost btn-sm" data-chat-action="cancel-edit">${ct('cancel')}</button><button type="submit" class="btn btn-primary btn-sm">${ct('save')}</button></div>
          </form>
        </div>`;
    }
    return `
      <div class="chat-msg chat-msg-user ${newestClass}" data-chat-msg="${message.id}">
        <div class="chat-msg-bubble">
          ${message.attachment ? `<div class="chat-msg-attachment">${message.attachment.previewUrl ? `<img src="${esc(message.attachment.previewUrl)}" alt="${esc(message.attachment.name)}">` : message.attachment.attachmentId ? `<img src="/api/chat/attachments/${message.attachment.attachmentId}" alt="${esc(message.attachment.name)}">` : `<div class="chat-attachment-chip">${icon(message.attachment.kind === 'text' ? 'file' : 'image', 14)}<span>${esc(message.attachment.name)}</span></div>`}</div>` : ''}
          <div class="chat-msg-text">${esc(message.content)}</div>
        </div>
        <div class="chat-msg-actions">
          <button class="icon-button icon-button-sm" data-chat-action="edit-message" data-chat-id="${message.id}" aria-label="${ct('edit')}" title="${ct('edit')}">${icon('edit', 14)}</button>
          <button class="icon-button icon-button-sm" data-chat-action="copy" data-chat-copy="${message.id}" aria-label="${ct('copy')}" title="${ct('copy')}">${icon('copy', 14)}</button>
        </div>
      </div>`;
  }

  const isStreamingThis = chatState.streaming && message.id === chatState.streamAssistantId;
  const isGenerating = message.status === 'generating' || isStreamingThis;
  const hasThinking = Boolean(message.thinking && message.thinking.length);
  // A message generated with Thinking mode on shows its reasoning panel from the very first render —
  // OPEN, with a live "thinking…" indicator in the summary — not only once actual reasoning text has
  // streamed in. thinkingRequested is set at message-creation time (see sendChat), before this first
  // render happens, specifically so the panel is already in the DOM ready to receive the hot loop's
  // surgical text updates the instant they arrive, instead of appearing only after some delay.
  const willThink = Boolean(message.thinkingRequested) || hasThinking;
  const showReasoningBlock = isGenerating ? willThink : hasThinking;
  const showThinkingPlaceholder = isGenerating && willThink && !hasThinking;
  const showTyping = isGenerating && !message.content && !willThink;
  return `
    <div class="chat-msg chat-msg-assistant ${isStreamingThis ? 'is-streaming' : ''} ${newestClass}" data-chat-msg="${message.id}">
      <div class="chat-msg-avatar" aria-hidden="true">${icon('spark', 15)}</div>
      <div class="chat-msg-bubble">
        ${showReasoningBlock ? `
          <details class="chat-reasoning" id="chat-reasoning-${message.id}" ${isStreamingThis ? 'open' : ''}>
            <summary>${icon('node', 13)}<span>${ct('reasoning')}</span><span class="chat-reasoning-live" id="chat-reasoning-live-${message.id}" style="${showThinkingPlaceholder ? '' : 'display:none'}"><i></i><i></i><i></i></span></summary>
            <p class="chat-reasoning-hint">${ct('reasoningHint')}</p>
            <div class="chat-reasoning-text" id="chat-msg-thinking-${message.id}">${esc(message.thinking || '')}</div>
          </details>` : ''}
        <div class="chat-typing" id="chat-msg-typing-${message.id}" style="${showTyping ? '' : 'display:none'}"><span></span><span></span><span></span></div>
        <div class="chat-msg-text" id="chat-msg-content-${message.id}"></div>
        ${message.unavailable ? `<p class="chat-msg-flag">${icon('warning', 13)}<span>${ct('unavailable')}</span></p>` : ''}
        ${message.stopped ? `<p class="chat-msg-flag">${ct('stopped')}</p>` : ''}
        ${message.aiGenerated ? `<p class="chat-ai-disclosure">${ct('aiDraft')}</p>` : ''}
      </div>
      ${!isGenerating ? `
        <div class="chat-msg-actions">
          <button class="icon-button icon-button-sm" data-chat-action="copy" data-chat-copy="${message.id}" aria-label="${ct('copy')}" title="${ct('copy')}">${icon('copy', 14)}</button>
          ${isLast ? `<button class="icon-button icon-button-sm" data-chat-action="regenerate" aria-label="${ct('regenerate')}" title="${ct('regenerate')}">${icon('refresh', 14)}</button>` : ''}
        </div>` : ''}
    </div>`;
}

function renderComposer(inWelcome) {
  const attachment = chatState.composerAttachment;
  const canThink = chatState.aiCapabilities.thinkingSupported;
  return `
    <form class="chat-composer ${chatState.dragActive ? 'drag-active' : ''}" id="chat-composer-form">
      ${chatState.dragActive ? `<div class="chat-drop-overlay">${icon('image', 20)}<span>${ct('dropHint')}</span></div>` : ''}
      ${attachment ? `<div class="chat-composer-attachment ${attachment.kind === 'text' ? 'is-file' : ''}">
        ${attachment.kind === 'text'
          ? `${icon('file', 20)}<span class="chat-file-name">${esc(attachment.name)}</span>`
          : `<img src="${esc(attachment.previewUrl)}" alt="">`}
        <button type="button" class="chat-attachment-remove" data-chat-action="remove-attachment" aria-label="${ct('remove')}">${icon('close', 12)}</button>
      </div>
      ${attachment.kind === 'image' ? `<p class="chat-ocr-status chat-ocr-${attachment.ocrStatus}">
        ${attachment.ocrStatus === 'pending' ? `<i class="chat-ocr-spinner" aria-hidden="true"></i><span>${ct('ocrExtracting')} ${attachment.ocrProgress || 0}%</span>` : ''}
        ${attachment.ocrStatus === 'done' ? `${icon('check', 13)}<span>${attachment.ocrText ? ct('ocrDone') : ct('ocrEmpty')}</span>` : ''}
        ${attachment.ocrStatus === 'error' ? `${icon('warning', 13)}<span>${ct('ocrError')}</span>` : ''}
      </p>` : ''}` : ''}
      ${chatState.attachmentError ? `<p class="chat-attachment-error">${icon('warning', 13)}<span>${esc(chatState.attachmentError)}</span></p>` : ''}
      <div class="chat-composer-row">
        <label class="chat-attach-button" title="${ct('attach')}"><input type="file" accept="image/*,.txt,.md,.py,.js,.jsx,.ts,.tsx,.json,.csv,.html,.css,.xml,.yml,.yaml,.sh,.log,.c,.cpp,.java,.rb,.go,.rs,.sql" id="chat-file-input" hidden>${icon('attach', 18)}</label>
        ${canThink ? `
          <button type="button" class="chat-thinking-btn ${chatState.thinkingMode ? 'on' : ''}" data-chat-action="toggle-thinking" role="switch" aria-checked="${chatState.thinkingMode}" aria-label="${ct('thinking')}" title="${ct('thinking')}">
            ${icon('node', 17)}<i class="chat-thinking-dot" aria-hidden="true"></i>
          </button>` : ''}
        <textarea id="chat-composer-input" class="chat-composer-input" placeholder="${canThink && chatState.thinkingMode ? ct('placeholderThinking') : ct('placeholder')}" rows="1" maxlength="4000"></textarea>
        ${chatState.streaming
          ? `<button type="button" class="chat-send-btn is-stop" data-chat-action="stop" aria-label="${ct('stop')}" title="${ct('stop')}">${icon('stop', 15)}</button>`
          : `<button type="submit" class="chat-send-btn" ${attachment?.kind === 'image' && attachment.ocrStatus === 'pending' ? 'disabled' : ''} aria-label="${ct('send')}" title="${ct('send')}">${icon('send', 16)}</button>`}
      </div>
    </form>${inWelcome ? '' : ''}`;
}

// ---------------------------------------------------------------------------
// Event wiring — all scoped to the Chat page, coexisting harmlessly with app.js's own delegated
// listeners (different attribute namespace: data-chat-*, never data-action/data-view).
// ---------------------------------------------------------------------------

document.addEventListener('click', async (event) => {
  if (state.view !== 'chat' && !event.target.closest('.chat-page')) return;

  if (chatState.openMenuId && !event.target.closest('.chat-kebab-wrap')) {
    chatState.openMenuId = null;
    renderNow();
    // fall through: this same click may still need normal handling (e.g. it opened a different row)
  }

  // app.js's own generic backdrop-click handler already removes the .modal-backdrop DOM node (it
  // doesn't know about chat.js state) — checking classList directly here (not .closest(), which can
  // break once that removal has already detached the node from the tree) keeps chatState in sync
  // regardless of which of the two listeners happens to run first.
  if (event.target.classList.contains('modal-backdrop') && chatState.confirmDeleteId) {
    chatState.confirmDeleteId = null;
    renderNow();
    return;
  }

  // Action buttons (pin/rename/archive/delete/...) live nested inside a conversation row that is
  // itself openable — this check must come first, or every click on those buttons would bubble into
  // the row's own data-chat-open handler below and just re-open the conversation instead.
  const action = event.target.closest('[data-chat-action]')?.dataset.chatAction;
  const actionId = event.target.closest('[data-chat-id]')?.dataset.chatId;

  if (!action) {
    const openItem = event.target.closest('[data-chat-open]');
    if (openItem) { openConversation(openItem.dataset.chatOpen); chatState.sidebarOpen = window.innerWidth > 900; renderNow(); return; }

    const suggestBtn = event.target.closest('[data-chat-suggest]');
    if (suggestBtn) {
      if (!chatState.activeConversation) await createConversation();
      document.getElementById('chat-composer-input') && (document.getElementById('chat-composer-input').value = suggestBtn.dataset.chatSuggest);
      sendChat({ content: suggestBtn.dataset.chatSuggest });
      return;
    }
    return;
  }

  if (action === 'new-chat') return createConversation();
  if (action === 'open-sidebar') { chatState.sidebarOpen = true; renderNow(); return; }
  if (action === 'close-sidebar') { chatState.sidebarOpen = false; renderNow(); return; }
  if (action === 'toggle-theme') { chatState.theme = chatState.theme === 'dark' ? 'light' : 'dark'; saveChatTheme(chatState.theme); renderNow(); return; }
  if (action === 'toggle-thinking') { chatState.thinkingMode = !chatState.thinkingMode; renderNow(); return; }
  if (action === 'toggle-menu') { chatState.openMenuId = chatState.openMenuId === actionId ? null : actionId; renderNow(); return; }
  if (action === 'pin') return patchConversation(actionId, { pinned: !chatState.conversations.find((item) => item.id === actionId)?.pinned });
  if (action === 'archive') { chatState.openMenuId = null; return patchConversation(actionId, { archived: !chatState.conversations.find((item) => item.id === actionId)?.archived }); }
  if (action === 'rename') { chatState.openMenuId = null; chatState.renamingId = actionId; renderNow(); document.getElementById('chat-rename-input')?.focus(); return; }
  if (action === 'delete') { chatState.openMenuId = null; chatState.confirmDeleteId = actionId; renderNow(); return; }
  if (action === 'cancel-delete') { chatState.confirmDeleteId = null; renderNow(); return; }
  if (action === 'confirm-delete') return deleteConversation(actionId);
  if (action === 'remove-attachment') { chatState.composerAttachment = null; chatState.attachmentError = null; renderNow(); return; }
  if (action === 'stop') return stopStreaming();
  if (action === 'scroll-bottom') { chatState.scrolledUp = false; scrollMessagesToBottom(); renderNow(); return; }
  if (action === 'regenerate') return sendChat({ regenerate: true });
  if (action === 'edit-message') {
    const message = chatState.activeConversation?.messages.find((item) => item.id === actionId);
    chatState.editingMessageId = actionId;
    renderNow();
    const textarea = document.getElementById('chat-edit-textarea');
    if (textarea) { textarea.focus(); textarea.setSelectionRange(textarea.value.length, textarea.value.length); }
    return;
  }
  if (action === 'cancel-edit') { chatState.editingMessageId = null; renderNow(); return; }
  if (action === 'copy') {
    const copyId = event.target.closest('[data-chat-copy]')?.dataset.chatCopy;
    const message = chatState.activeConversation?.messages.find((item) => item.id === copyId);
    if (message) {
      try { await navigator.clipboard.writeText(message.content); toast(ct('copied')); }
      catch { toast(message.content ? ct('copied') : '', message.content ? '' : 'error'); }
    }
    return;
  }
});

document.addEventListener('click', (event) => {
  // code-block copy buttons live inside rendered Markdown, anywhere on the Chat page
  const copyCodeBtn = event.target.closest('[data-md-copy]');
  if (!copyCodeBtn || !copyCodeBtn.closest('.chat-page')) return;
  event.preventDefault();
  const code = copyCodeBtn.closest('.md-code-block')?.querySelector('code')?.textContent || '';
  navigator.clipboard?.writeText(code).then(() => {
    const original = copyCodeBtn.textContent;
    copyCodeBtn.textContent = ct('copied');
    setTimeout(() => { copyCodeBtn.textContent = original; }, 1500);
  }).catch(() => {});
});

document.addEventListener('submit', (event) => {
  if (event.target.id === 'chat-composer-form') {
    event.preventDefault();
    const input = document.getElementById('chat-composer-input');
    const content = input?.value.trim() || '';
    if (!content && !chatState.composerAttachment) return;
    if (chatState.composerAttachment?.kind === 'image' && chatState.composerAttachment.ocrStatus === 'pending') return;
    if (input) input.value = '';
    sendChat({ content });
    return;
  }
  const renameForm = event.target.closest('[data-chat-rename-form]');
  if (renameForm) {
    event.preventDefault();
    const conversationId = renameForm.dataset.chatRenameForm;
    const newTitle = renameForm.querySelector('input')?.value.trim();
    chatState.renamingId = null;
    if (newTitle) patchConversation(conversationId, { title: newTitle });
    else renderNow();
    return;
  }
  const editForm = event.target.closest('[data-chat-edit-form]');
  if (editForm) {
    event.preventDefault();
    const messageId = editForm.dataset.chatEditForm;
    const newText = editForm.querySelector('textarea')?.value.trim();
    chatState.editingMessageId = null;
    if (newText) sendChat({ content: newText, editFromMessageId: messageId });
    else renderNow();
    return;
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'chat-search-input') { chatState.search = event.target.value; renderNow(); return; }
  if (event.target.id === 'chat-composer-input') {
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 200)}px`;
    return;
  }
  if (event.target.id === 'chat-file-input' && event.target.files?.[0]) { attachFile(event.target.files[0]); event.target.value = ''; }
});

document.addEventListener('keydown', (event) => {
  if (event.target.id === 'chat-composer-input' && event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    document.getElementById('chat-composer-form')?.requestSubmit();
  }
  // app.js's own generic keydown listener already closes any .modal-backdrop on Escape (DOM only) —
  // this clears the matching chat.js state so the delete-confirm dialog cannot silently reappear on
  // a later unrelated re-render.
  if (event.key === 'Escape' && chatState.confirmDeleteId) chatState.confirmDeleteId = null;
});

document.addEventListener('scroll', (event) => {
  if (event.target.id !== 'chat-messages') return;
  const el = event.target;
  chatState.scrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > 120;
}, true);

document.addEventListener('dragover', (event) => {
  if (!event.target.closest('.chat-composer')) return;
  event.preventDefault();
  if (!chatState.dragActive) { chatState.dragActive = true; renderNow(); }
});
document.addEventListener('dragleave', (event) => {
  if (!event.target.closest('.chat-composer')) return;
  chatState.dragActive = false;
  renderNow();
});
document.addEventListener('drop', (event) => {
  if (!event.target.closest('.chat-composer')) return;
  event.preventDefault();
  chatState.dragActive = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) attachFile(file);
  else renderNow();
});

export { renderChatPage };
