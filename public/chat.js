// AI Chat page: a separate, general-purpose multi-conversation study assistant. Distinct from the
// small lesson-grounded tutor widget in app.js (left untouched) — this is the 6th nav destination,
// with real conversation history, streaming, image attachments, and a Thinking/Normal mode toggle.
// See docs/DECISIONS.md for the architecture (NDJSON streaming protocol, two-phase write-queue
// design, client-side image resize, on-disk attachment persistence).
import { api, esc, id, lang, local, render, state, t, toast } from './app.js';
import { renderMarkdownToDOM } from './markdown.js';
import { detectConversationLanguage } from './langdetect.js';

const CHAT_HISTORY_WINDOW = 12;
const MAX_IMAGE_EDGE = 1600;
const MAX_ATTACHMENT_BYTES = 4_000_000;

const copy = {
  ar: {
    newChat: 'محادثة جديدة', search: 'ابحث في المحادثات…', pinned: 'مثبّتة', conversations: 'المحادثات',
    noConversations: 'لا توجد محادثات بعد', noResults: 'لا نتائج مطابقة', startHint: 'ابدأ محادثة جديدة من الأعلى.',
    welcomeTitle: 'أهلًا، بماذا أساعدك اليوم؟', welcomeBody: 'اسأل عن أي فكرة دراسية، اطلب شرحًا، أو ناقش مسألة خطوة بخطوة.',
    suggestion1: 'اشرح لي معنى السرعة المتوسطة بمثال', suggestion2: 'ساعدني أفهم رسم المسافة والزمن', suggestion3: 'كيف أراجع لاختبار الغد بذكاء؟',
    placeholder: 'اكتب رسالتك…', placeholderThinking: 'اسأل سؤالاً يحتاج تفكيرًا عميقًا…', send: 'إرسال', stop: 'إيقاف', thinking: 'تفكير عميق', reasoning: 'التحليل', reasoningHint: 'حالة موجزة لعملية التحليل — لا تعرض سلسلة التفكير الخاصة.',
    attach: 'إرفاق ملف أو صورة', remove: 'إزالة', rename: 'إعادة تسمية', pin: 'تثبيت', unpin: 'إلغاء التثبيت', archive: 'أرشفة', unarchive: 'إلغاء الأرشفة', delete: 'حذف',
    confirmDeleteTitle: 'حذف المحادثة؟', confirmDeleteBody: 'سيتم حذف هذه المحادثة وكل رسائلها نهائيًا.', cancel: 'إلغاء', regenerate: 'إعادة توليد', copy: 'نسخ', copied: 'تم النسخ',
    edit: 'تعديل', save: 'حفظ', aiDraft: 'مسودة ذكاء اصطناعي', stopped: 'تم الإيقاف', continueResponse: 'متابعة الرد', retryContinue: 'إعادة محاولة المتابعة', continuationFailed: 'تعذرت المتابعة — بقي الرد الجزئي محفوظًا.', unavailable: 'المساعد غير متاح الآن',
    imageRejected: 'الملفات غير الصورية غير مدعومة.', imageTooLarge: 'حجم الصورة كبير جدًا.', fileTooLarge: 'حجم الملف كبير جدًا (الحد الأقصى 2 ميجابايت).', fileReadFailed: 'تعذّرت قراءة الملف.', fileTypeRejected: 'نوع الملف غير مدعوم. يمكنك إرفاق صورة أو ملف نصي (txt, py, json, ...).', contextDivider: 'الرسائل الأقدم غير متاحة لذاكرة المساعد في هذا الرد.',
    ocrExtracting: 'جارٍ استخراج النص من الصورة…', ocrDone: 'تم استخراج النص من الصورة', ocrEmpty: 'لم يُعثر على نص مقروء في الصورة', ocrError: 'تعذّر استخراج النص من الصورة', ocrLoadFailed: 'تعذّر تحميل محرك قراءة النصوص',
    lightMode: 'وضع فاتح', darkMode: 'وضع داكن', you: 'أنت', assistant: 'المساعد', unavailableChip: 'الدردشة الذكية غير مفعّلة على هذه النسخة بعد.',
    dropHint: 'أفلت الصورة هنا', newMessages: 'رسائل جديدة',
    assistantOnline: 'المساعد جاهز', assistantOffline: 'المساعد غير متاح', history: 'السجل', archived: 'المؤرشفة',
    activeChats: 'النشطة', noArchived: 'لا توجد محادثات مؤرشفة', today: 'اليوم', yesterday: 'أمس', older: 'أقدم',
    responseTime: 'زمن الاستجابة', firstToken: 'أول كلمة', totalTime: 'الكلي', goodSpeed: 'سريع', fairSpeed: 'جيد', slowSpeed: 'بطيء',
    chatWorkspace: 'مساحة الدراسة الذكية', messagesLabel: 'رسالة', clearSearch: 'مسح البحث',
  },
  en: {
    newChat: 'New chat', search: 'Search conversations…', pinned: 'Pinned', conversations: 'Conversations',
    noConversations: 'No conversations yet', noResults: 'No matching conversations', startHint: 'Start a new one above.',
    welcomeTitle: 'Hi — what can I help you with?', welcomeBody: 'Ask about any study topic, request an explanation, or work through a problem step by step.',
    suggestion1: 'Explain average speed with a worked example', suggestion2: 'Help me understand distance-time graphs', suggestion3: 'How should I revise for tomorrow’s test?',
    placeholder: 'Write your message…', placeholderThinking: 'Ask something that needs deep thinking…', send: 'Send', stop: 'Stop', thinking: 'Deep thinking', reasoning: 'Analysis', reasoningHint: 'A concise analysis status — private chain-of-thought is not displayed.',
    attach: 'Attach a file or image', remove: 'Remove', rename: 'Rename', pin: 'Pin', unpin: 'Unpin', archive: 'Archive', unarchive: 'Unarchive', delete: 'Delete',
    confirmDeleteTitle: 'Delete this conversation?', confirmDeleteBody: 'This conversation and all its messages will be permanently deleted.', cancel: 'Cancel', regenerate: 'Regenerate', copy: 'Copy', copied: 'Copied',
    edit: 'Edit', save: 'Save', aiDraft: 'AI draft', stopped: 'Stopped', continueResponse: 'Continue response', retryContinue: 'Retry continuation', continuationFailed: 'Continuation failed — the partial response is preserved.', unavailable: 'The assistant is unavailable right now',
    imageRejected: 'Non-image files are not supported.', imageTooLarge: 'That image is too large.', fileTooLarge: 'That file is too large (2MB max).', fileReadFailed: 'Could not read that file.', fileTypeRejected: 'That file type isn’t supported. Attach an image or a text file (txt, py, json, ...).', contextDivider: 'Earlier messages aren’t included in the assistant’s memory for this reply.',
    ocrExtracting: 'Extracting text from image…', ocrDone: 'Text extracted from image', ocrEmpty: 'No readable text found in the image', ocrError: 'Could not extract text from the image', ocrLoadFailed: 'Could not load the text-reading engine',
    lightMode: 'Light mode', darkMode: 'Dark mode', you: 'You', assistant: 'Assistant', unavailableChip: 'AI Chat is not set up on this deployment yet.',
    dropHint: 'Drop image here', newMessages: 'New messages',
    assistantOnline: 'AI ready', assistantOffline: 'AI unavailable', history: 'History', archived: 'Archived',
    activeChats: 'Active', noArchived: 'No archived conversations', today: 'Today', yesterday: 'Yesterday', older: 'Older',
    responseTime: 'Response', firstToken: 'first token', totalTime: 'total', goodSpeed: 'Fast', fairSpeed: 'Okay', slowSpeed: 'Slow',
    chatWorkspace: 'AI study space', messagesLabel: 'messages', clearSearch: 'Clear search',
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
  continue: '<path d="M7 4.8 18.5 12 7 19.2V4.8Z" fill="currentColor"/><path d="M4.2 5.5v13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  search: '<circle cx="10.3" cy="10.3" r="6" stroke="currentColor" stroke-width="1.6"/><path d="M14.8 14.8 19.5 19.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  file: '<path d="M6.5 3h7.2L18 6.8V20a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/><path d="M13.5 3v3.8H18M9 12.2h6M9 15.5h6M9 8.8h2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  dots: '<circle cx="4" cy="10" r="1.6" fill="currentColor"/><circle cx="10" cy="10" r="1.6" fill="currentColor"/><circle cx="16" cy="10" r="1.6" fill="currentColor"/>',
  node: '<circle cx="12" cy="6" r="2.1" stroke="currentColor" stroke-width="1.6"/><circle cx="5.5" cy="17" r="2.1" stroke="currentColor" stroke-width="1.6"/><circle cx="18.5" cy="17" r="2.1" stroke="currentColor" stroke-width="1.6"/><path d="M12 8.1V12M12 12l-5.3 3.3M12 12l5.3 3.3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  arrowDown: '<path d="M12 4v14.5M6 13l6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>',
};
function icon(name, size = 16) {
  return `<svg class="chat-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

// Per-message language is detected before the placeholder is mounted. It drives layout, typography,
// and both reasoning/answer text direction from the first frame; the server uses the same detector and
// streams a localized user-facing rationale rather than the model's uncontrolled native trace.
function msgDir(language) {
  return language === 'en' ? 'ltr' : 'rtl';
}
function msgLangClass(language) {
  return language === 'en' ? 'lang-en' : 'lang-ar';
}
function applyMessageLanguageDOM(domId, language) {
  const wrapper = document.querySelector(`[data-chat-msg="${domId}"]`);
  if (!wrapper) return;
  wrapper.setAttribute('dir', msgDir(language));
  wrapper.classList.remove('lang-ar', 'lang-en');
  wrapper.classList.add(msgLangClass(language));
  wrapper.querySelectorAll('.chat-msg-text, .chat-reasoning-text').forEach((node) => node.setAttribute('dir', msgDir(language)));
}

function loadChatTheme() {
  try { return localStorage.getItem('lp-chat-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; }
}
function saveChatTheme(theme) {
  try { localStorage.setItem('lp-chat-theme', theme); } catch { /* private mode: preference won't persist */ }
}

const chatState = {
  initialized: false, loadingList: false, conversations: [], aiCapabilities: { chatAvailable: false, thinkingSupported: false },
  activeId: null, activeConversation: null, loadingConversation: false, creatingConversation: null, openRequestVersion: 0,
  search: '', sidebarOpen: window.innerWidth > 900, showArchived: false,
  composerAttachment: null, attachmentError: null, thinkingMode: false,
  streaming: false, streamAbort: null, streamAssistantId: null, streamDomId: null, streamLanguage: 'ar', streamContent: '', streamThinking: '',
  editingMessageId: null, renamingId: null, confirmDeleteId: null, openMenuId: null, dragActive: false,
  theme: loadChatTheme(), scrolledUp: false,
};

function formatDuration(ms) {
  if (!Number.isFinite(ms)) return '';
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(ms < 10_000 ? 1 : 0)} s`;
}

function speedRating(ms) {
  if (!Number.isFinite(ms)) return null;
  if (ms <= 2000) return { label: ct('goodSpeed'), className: 'fast' };
  if (ms <= 5000) return { label: ct('fairSpeed'), className: 'fair' };
  return { label: ct('slowSpeed'), className: 'slow' };
}

function relativeConversationDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today - target) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString(lang() === 'en' ? 'en' : 'ar', { hour: 'numeric', minute: '2-digit' });
  if (days === 1) return ct('yesterday');
  return date.toLocaleDateString(lang() === 'en' ? 'en' : 'ar', { month: 'short', day: 'numeric' });
}

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
  if (!conversationId) return;
  const requestVersion = ++chatState.openRequestVersion;
  chatState.activeId = conversationId;
  chatState.loadingConversation = true;
  chatState.activeConversation = null;
  refreshSidebarDOM();
  try {
    const result = await api(`/api/chat/conversations/${conversationId}`);
    if (requestVersion !== chatState.openRequestVersion || chatState.activeId !== conversationId) return;
    chatState.activeConversation = result.conversation;
  } catch (error) {
    if (requestVersion !== chatState.openRequestVersion) return;
    toast(error.message, 'error');
    chatState.activeId = null;
  } finally {
    if (requestVersion !== chatState.openRequestVersion) return;
    chatState.loadingConversation = false;
    refreshChatMainDOM({ focusInput: true });
    refreshSidebarDOM();
  }
}

async function createConversation({ renderResult = true, focusInput = true } = {}) {
  if (chatState.creatingConversation) return chatState.creatingConversation;
  chatState.creatingConversation = (async () => {
    const requestVersion = ++chatState.openRequestVersion;
    const result = await api('/api/chat/conversations', { method: 'POST', body: JSON.stringify({}) });
    if (!chatState.conversations.some((item) => item.id === result.conversation.id)) chatState.conversations.unshift({ id: result.conversation.id, title: null, pinned: false, archived: false, createdAt: result.conversation.createdAt, updatedAt: result.conversation.updatedAt, preview: '' });
    if (requestVersion !== chatState.openRequestVersion) { refreshSidebarDOM(); return result.conversation; }
    chatState.activeId = result.conversation.id;
    chatState.activeConversation = result.conversation;
    chatState.search = '';
    chatState.sidebarOpen = window.innerWidth > 900;
    if (renderResult) {
      refreshChatMainDOM({ focusInput });
      refreshSidebarDOM();
    }
    return result.conversation;
  })();
  try {
    return await chatState.creatingConversation;
  } catch (error) {
    toast(error.message, 'error');
    return null;
  } finally {
    chatState.creatingConversation = null;
  }
}

async function patchConversation(conversationId, patch) {
  const summary = chatState.conversations.find((item) => item.id === conversationId);
  const previous = summary ? { ...summary } : null;
  if (summary) Object.assign(summary, patch, { updatedAt: new Date().toISOString() });
  refreshSidebarDOM();
  try {
    const result = await api(`/api/chat/conversations/${conversationId}`, { method: 'PATCH', body: JSON.stringify(patch) });
    if (summary) Object.assign(summary, { title: result.conversation.title, pinned: result.conversation.pinned, archived: result.conversation.archived, updatedAt: result.conversation.updatedAt });
    if (chatState.activeConversation?.id === conversationId) chatState.activeConversation = { ...chatState.activeConversation, ...result.conversation };
    if (patch.archived === true && !chatState.showArchived && chatState.activeId === conversationId) {
      chatState.activeId = null;
      chatState.activeConversation = null;
      refreshChatMainDOM({ focusInput: true });
      refreshSidebarDOM();
    } else {
      refreshSidebarDOM();
    }
  } catch (error) {
    if (summary && previous) Object.assign(summary, previous);
    refreshSidebarDOM();
    toast(error.message, 'error');
  }
}

async function deleteConversation(conversationId) {
  try {
    await api(`/api/chat/conversations/${conversationId}`, { method: 'DELETE' });
    chatState.conversations = chatState.conversations.filter((item) => item.id !== conversationId);
    if (chatState.activeId === conversationId) { chatState.activeId = null; chatState.activeConversation = null; }
    chatState.confirmDeleteId = null;
    refreshChatMainDOM({ focusInput: true });
    refreshSidebarDOM();
    syncDeleteModalDOM();
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
  if (file.size > 2_000_000) { chatState.attachmentError = ct('fileTooLarge'); refreshComposerDOM(); return; }
  try {
    let text = await file.text();
    let truncated = false;
    if (text.length > MAX_TEXT_ATTACHMENT_CHARS) { text = text.slice(0, MAX_TEXT_ATTACHMENT_CHARS); truncated = true; }
    chatState.composerAttachment = { kind: 'text', name: file.name, content: text, size: file.size, truncated };
  } catch {
    chatState.attachmentError = ct('fileReadFailed');
  }
  refreshComposerDOM();
}

async function attachFile(file) {
  if (isTextFile(file)) return attachTextFile(file);
  if (file.type.startsWith('image/')) return attachImageFile(file);
  chatState.attachmentError = ct('fileTypeRejected');
  refreshComposerDOM();
}

async function attachImageFile(file) {
  chatState.attachmentError = null;
  if (file.size > MAX_ATTACHMENT_BYTES * 4) { chatState.attachmentError = ct('imageTooLarge'); refreshComposerDOM(); return; }
  try {
    const resized = await resizeImageFile(file);
    resized.ocrStatus = 'pending';
    resized.ocrProgress = 0;
    resized.ocrText = '';
    chatState.composerAttachment = resized;
    refreshComposerDOM();
    runOcr(resized);
  } catch {
    chatState.attachmentError = ct('imageTooLarge');
    refreshComposerDOM();
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
      updateOcrStatusDOM(attachment);
    });
    if (chatState.composerAttachment !== attachment) return;
    attachment.ocrStatus = 'done';
    attachment.ocrText = text.slice(0, MAX_TEXT_ATTACHMENT_CHARS);
  } catch {
    if (chatState.composerAttachment !== attachment) return;
    attachment.ocrStatus = 'error';
  }
  updateOcrStatusDOM(attachment);
}

// Tesseract's progress callback fires many times a second while recognizing — routing every tick
// through the full renderNow() tore down and rebuilt the whole composer each time, which forced the
// browser to redecode the preview <img> from scratch on every tick even though its blob: URL never
// changed, visibly flickering/"reloading" the image throughout OCR. Only the status line's percentage
// actually changes per tick, so only that gets touched; the one real state change (pending -> done/
// error, which also enables the send button) still goes through a normal renderNow() at the end.
function updateOcrStatusDOM(attachment) {
  const el = document.querySelector('.chat-ocr-status');
  if (!el) { refreshComposerDOM(); return; }
  el.className = `chat-ocr-status chat-ocr-${attachment.ocrStatus}`;
  el.innerHTML = attachment.ocrStatus === 'pending'
    ? `<i class="chat-ocr-spinner" aria-hidden="true"></i><span>${ct('ocrExtracting')} ${attachment.ocrProgress || 0}%</span>`
    : attachment.ocrStatus === 'done'
      ? `${icon('check', 13)}<span>${attachment.ocrText ? ct('ocrDone') : ct('ocrEmpty')}</span>`
      : `${icon('warning', 13)}<span>${ct('ocrError')}</span>`;
  document.querySelector('.chat-send-btn')?.toggleAttribute('disabled', attachment.ocrStatus === 'pending');
}

// ---------------------------------------------------------------------------
// Streaming send / stop / regenerate / edit-resubmit
// ---------------------------------------------------------------------------

function contextDividerIndexFor(conversation) {
  return conversation.messages.length > CHAT_HISTORY_WINDOW ? conversation.messages.length - CHAT_HISTORY_WINDOW : -1;
}

async function sendChat({ content = '', regenerate = false, editFromMessageId = null, continueMessageId = null } = {}) {
  if (chatState.streaming) return;
  // The welcome screen is a ready-to-use draft. Persist its conversation on first submit so the
  // user never has to press "New chat" before Enter or Send can work.
  if (!chatState.activeConversation) {
    const created = await createConversation({ renderResult: false, focusInput: false });
    if (!created) return;
    if (chatState.streaming) return;
  }
  const conversation = chatState.activeConversation;
  const continuingMessage = continueMessageId
    ? conversation.messages.find((message) => message.id === continueMessageId && message.role === 'assistant' && ['stopped', 'failed'].includes(message.status))
    : null;
  if (continueMessageId && (!continuingMessage || conversation.messages.at(-1)?.id !== continueMessageId || !continuingMessage.content)) return;
  const attachment = chatState.composerAttachment;
  // Images are only ever handed to the assistant as OCR'd text (see runOcr) — sending before that
  // finishes would either block on nothing (no text yet) or silently drop the image's content.
  if (attachment?.kind === 'image' && attachment.ocrStatus === 'pending') return;
  const idempotencyKey = id();

  if (continuingMessage) {
    continuingMessage.status = 'continuing';
    continuingMessage.stopped = false;
    continuingMessage.unavailable = false;
    continuingMessage.recoverable = false;
  } else if (!regenerate) {
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
  // Detected once, here, from the exact same conversation state the server will independently compute
  // it from (see server.mjs's identical use of detectConversationLanguage) — not awaited from the
  // network. That is what lets the placeholder bubble render with correct RTL/LTR direction and
  // typography from the very first frame, with nothing to flip once the real response starts arriving.
  const detectedLanguage = continuingMessage?.language || detectConversationLanguage(
    conversation.messages.filter((message) => message.role === 'user').slice(-CHAT_HISTORY_WINDOW).map((message) => message.content),
    'ar',
  );
  if (!regenerate && !continuingMessage) conversation.messages[conversation.messages.length - 1].language = detectedLanguage;
  const willUseThinking = chatState.thinkingMode && chatState.aiCapabilities.thinkingSupported;
  const placeholderId = continuingMessage?.id || `pending-assistant-${idempotencyKey}`;
  if (!continuingMessage) conversation.messages.push({ id: placeholderId, role: 'assistant', content: '', thinking: '', status: 'generating', thinkingRequested: willUseThinking, language: detectedLanguage });

  chatState.composerAttachment = null;
  chatState.attachmentError = null;
  chatState.streaming = true;
  chatState.streamAssistantId = placeholderId;
  chatState.streamDomId = placeholderId;
  chatState.streamLanguage = detectedLanguage;
  chatState.streamContent = continuingMessage?.content || '';
  chatState.streamThinking = continuingMessage?.thinking || '';
  resetStreamReveal(chatState.streamContent.length);
  chatState.scrolledUp = false;
  if (continuingMessage) refreshChatMainDOM();
  else mountPendingTurn({ regenerate, editFromMessageId });

  const controller = new AbortController();
  chatState.streamAbort = controller;
  const requestStartedAt = performance.now();
  let firstVisibleResponseAt = null;

  const body = { idempotencyKey, regenerate, editFromMessageId };
  if (continuingMessage) body.continueMessageId = continuingMessage.id;
  else if (!regenerate) body.content = content;
  if (attachment) {
    body.attachment = attachment.kind === 'text'
      ? { kind: 'text', name: attachment.name, content: attachment.content }
      : { kind: 'image', name: attachment.name, type: attachment.type, dataBase64: attachment.dataBase64, ocrText: attachment.ocrText || '' };
  }
  if (willUseThinking && !continuingMessage) body.thinking = true;

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
          if (realUserId && !regenerate && !continuingMessage) {
            const pendingUser = conversation.messages.find((message) => message.id === `pending-${idempotencyKey}`);
            if (pendingUser) {
              remapMessageDomId(pendingUser.id, realUserId);
              pendingUser.id = realUserId;
            }
          }
          chatState.streamAssistantId = realAssistantId;
          // The server's detection is authoritative — this should already match what was computed
          // locally at send-time (same function, same input), so in practice this is a no-op
          // confirmation, not a source of visible change.
          if (parsed.language && parsed.language !== chatState.streamLanguage) {
            chatState.streamLanguage = parsed.language;
            if (assistantMessage) assistantMessage.language = parsed.language;
            applyMessageLanguageDOM(chatState.streamDomId, parsed.language);
          }
          if (!conversation.title && parsed.title) {
            conversation.title = parsed.title;
            updateChatHeaderDOM();
          }
        } else if (parsed.type === 'delta') {
          if (firstVisibleResponseAt === null) firstVisibleResponseAt = performance.now();
          if (parsed.kind === 'thinking') chatState.streamThinking += parsed.text;
          else chatState.streamContent += parsed.text;
          updateStreamingBubbleDOM();
        } else if (parsed.type === 'done') {
          const assistantMessage = conversation.messages.find((message) => message.id === realAssistantId);
          if (assistantMessage) {
            assistantMessage.content = chatState.streamContent;
            assistantMessage.thinking = chatState.streamThinking;
            assistantMessage.status = parsed.stopped ? 'stopped' : (parsed.recoverable ? 'failed' : 'complete');
            assistantMessage.aiGenerated = parsed.aiGenerated;
            assistantMessage.unavailable = parsed.unavailable;
            assistantMessage.stopped = parsed.stopped;
            assistantMessage.recoverable = Boolean(parsed.recoverable);
            assistantMessage.timing = parsed.timing || {
              firstResponseMs: firstVisibleResponseAt === null ? null : Math.round(firstVisibleResponseAt - requestStartedAt),
              totalMs: Math.round(performance.now() - requestStartedAt),
            };
          }
        }
      }
    }
  } catch (error) {
    const assistantMessage = conversation.messages.find((message) => message.id === chatState.streamAssistantId || message.id === placeholderId);
    if (assistantMessage) {
      assistantMessage.content = chatState.streamContent || (error.name === 'AbortError' ? '' : error.message);
      assistantMessage.thinking = chatState.streamThinking;
      assistantMessage.status = error.name === 'AbortError' ? 'stopped' : 'failed';
      assistantMessage.stopped = error.name === 'AbortError';
      assistantMessage.unavailable = error.name !== 'AbortError';
      assistantMessage.recoverable = error.name !== 'AbortError';
      assistantMessage.aiGenerated = false;
      assistantMessage.timing = {
        firstResponseMs: firstVisibleResponseAt === null ? null : Math.round(firstVisibleResponseAt - requestStartedAt),
        totalMs: Math.round(performance.now() - requestStartedAt),
      };
    }
  } finally {
    const finalDomId = chatState.streamDomId;
    chatState.streaming = false;
    chatState.streamAbort = null;
    const summary = chatState.conversations.find((item) => item.id === conversation.id);
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    if (summary) { summary.updatedAt = new Date().toISOString(); summary.title = conversation.title; summary.preview = String(lastMessage?.content || '').slice(0, 120); }
    reorderConversationSummaries();
    finalizeStreamingTurn(finalDomId);
    chatState.streamAssistantId = null;
    chatState.streamDomId = null;
  }
}

function reorderConversationSummaries() {
  chatState.conversations.sort((a, b) => (Number(b.pinned) - Number(a.pinned)) || b.updatedAt.localeCompare(a.updatedAt));
}

function stopStreaming() {
  chatState.streamAbort?.abort();
}

// A paced reveal decouples the visual cadence from arbitrary network chunk sizes. The visible prefix
// is rendered as Markdown on every paint, so bold, lists, code, and headings stay formatted while the
// answer grows. An adaptive rate catches up after a burst without dumping a whole chunk at once.
let streamPaintFrame = 0;
let streamVisibleLength = 0;
let streamRevealBudget = 0;
let streamLastFrameAt = 0;
let streamLastRenderedLength = -1;

function resetStreamReveal(initialLength = 0) {
  if (streamPaintFrame) cancelAnimationFrame(streamPaintFrame);
  streamPaintFrame = 0;
  streamVisibleLength = initialLength;
  streamRevealBudget = 0;
  streamLastFrameAt = 0;
  streamLastRenderedLength = -1;
}

function updateStreamingBubbleDOM() {
  if (streamPaintFrame) return;
  streamPaintFrame = requestAnimationFrame(paintStreamingFrame);
}

function paintStreamingFrame(now) {
  streamPaintFrame = 0;
  const msgId = chatState.streamDomId;
  if (!msgId) return;
  const remaining = Math.max(0, chatState.streamContent.length - streamVisibleLength);
  if (remaining) {
    const elapsed = streamLastFrameAt ? Math.min(80, now - streamLastFrameAt) : 16;
    const charactersPerSecond = Math.min(240, 52 + remaining * 1.4);
    streamRevealBudget += (elapsed / 1000) * charactersPerSecond;
    const revealCount = Math.min(remaining, Math.floor(streamRevealBudget));
    if (revealCount > 0) {
      streamVisibleLength += revealCount;
      streamRevealBudget -= revealCount;
    }
  }
  streamLastFrameAt = now;

  const contentEl = document.getElementById(`chat-msg-content-${msgId}`);
  const thinkingEl = document.getElementById(`chat-msg-thinking-${msgId}`);
  if (contentEl && (streamLastRenderedLength !== streamVisibleLength || !contentEl.childNodes.length)) {
    const visibleContent = chatState.streamContent.slice(0, streamVisibleLength);
    contentEl.replaceChildren(renderMarkdownToDOM(visibleContent));
    animateStreamTail(contentEl);
    appendStreamCursor(contentEl);
    streamLastRenderedLength = streamVisibleLength;
  }
  if (thinkingEl) thinkingEl.textContent = chatState.streamThinking;
  if (chatState.streamContent || chatState.streamThinking) document.getElementById(`chat-msg-typing-${msgId}`)?.remove();
  if (chatState.streamThinking) document.getElementById(`chat-reasoning-live-${msgId}`)?.remove();
  document.querySelector(`[data-chat-msg="${msgId}"]`)?.classList.toggle('has-stream-text', Boolean(chatState.streamContent));
  if (!chatState.scrolledUp) scrollMessagesToBottom();
  if (streamVisibleLength < chatState.streamContent.length) updateStreamingBubbleDOM();
}

function animateStreamTail(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let lastText = null;
  while (walker.nextNode()) if (walker.currentNode.data) lastText = walker.currentNode;
  if (!lastText?.data) return;
  const value = lastText.data;
  const newest = document.createElement('span');
  newest.className = 'chat-char-in';
  newest.textContent = value.slice(-1);
  lastText.replaceWith(document.createTextNode(value.slice(0, -1)), newest);
}

// Keep the caret inside the final rendered block. Appending it to the root puts it beside a <p>,
// which is exactly what caused the detached-cursor box/line shown in the reported screenshot.
function appendStreamCursor(el) {
  el.querySelector('.chat-stream-cursor')?.remove();
  const cursor = document.createElement('span');
  cursor.className = 'chat-stream-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  const tails = el.querySelectorAll('p, h1, h2, h3, li, blockquote, td, th, .md-code-block code');
  const tail = tails[tails.length - 1] || el;
  tail.appendChild(cursor);
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

function refreshChatMainDOM({ focusInput = false } = {}) {
  if (state.view !== 'chat') return;
  const main = document.querySelector('.chat-main');
  if (!main) return;
  main.innerHTML = `${renderChatHeader()}${chatState.activeConversation?.messages.length ? renderConversationBody() : renderChatWelcome()}`;
  hydrateChatMessages();
  if (chatState.streaming) updateStreamingBubbleDOM();
  if (!chatState.scrolledUp) scrollMessagesToBottom();
  if (focusInput) focusComposer();
}

function refreshComposerDOM({ preserveText = true, focus = false } = {}) {
  const current = document.getElementById('chat-composer-form');
  if (!current) return;
  const oldInput = current.querySelector('#chat-composer-input');
  const value = preserveText ? (oldInput?.value || '') : '';
  const wasFocused = document.activeElement === oldInput;
  const inWelcome = Boolean(current.closest('.chat-welcome'));
  const template = document.createElement('template');
  template.innerHTML = renderComposer(inWelcome).trim();
  const next = template.content.querySelector('#chat-composer-form');
  if (!next) return;
  current.replaceWith(next);
  const input = next.querySelector('#chat-composer-input');
  if (input) {
    input.value = value;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 200)}px`;
    if (focus || wasFocused) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function updateChatHeaderDOM() {
  const current = document.querySelector('.chat-main-header');
  if (!current) return;
  const template = document.createElement('template');
  template.innerHTML = renderChatHeader().trim();
  const next = template.content.firstElementChild;
  if (next) current.replaceWith(next);
}

function remapMessageDomId(oldId, newId) {
  if (!oldId || !newId || oldId === newId) return;
  const wrapper = document.querySelector(`[data-chat-msg="${oldId}"]`);
  if (!wrapper) return;
  wrapper.dataset.chatMsg = newId;
  wrapper.querySelectorAll('[data-chat-id]').forEach((node) => { if (node.dataset.chatId === oldId) node.dataset.chatId = newId; });
  wrapper.querySelectorAll('[data-chat-copy]').forEach((node) => { if (node.dataset.chatCopy === oldId) node.dataset.chatCopy = newId; });
}

function mountPendingTurn({ regenerate = false, editFromMessageId = null } = {}) {
  const conversation = chatState.activeConversation;
  const messagesEl = document.getElementById('chat-messages');
  if (!conversation || !messagesEl || regenerate || editFromMessageId) {
    refreshChatMainDOM();
    return;
  }
  messagesEl.querySelector('[data-chat-action="regenerate"]')?.remove();
  const pending = conversation.messages.slice(-2);
  const template = document.createElement('template');
  template.innerHTML = pending.map((message) => renderMessage(message, conversation)).join('');
  messagesEl.append(template.content);
  refreshComposerDOM({ preserveText: false });
  updateChatHeaderDOM();
  scrollMessagesToBottom();
}

function finalizeStreamingTurn(domId) {
  resetStreamReveal();
  const conversation = chatState.activeConversation;
  const message = conversation?.messages.find((item) => item.id === chatState.streamAssistantId);
  const current = domId ? document.querySelector(`[data-chat-msg="${domId}"]`) : null;
  if (!conversation || !message || !current) {
    refreshChatMainDOM();
    return;
  }
  const template = document.createElement('template');
  template.innerHTML = renderMessage(message, conversation).trim();
  const next = template.content.firstElementChild;
  if (next) {
    current.replaceWith(next);
    const contentEl = document.getElementById(`chat-msg-content-${message.id}`);
    if (contentEl && message.content) contentEl.replaceChildren(renderMarkdownToDOM(message.content));
  }
  refreshComposerDOM({ preserveText: false, focus: true });
  updateChatHeaderDOM();
  refreshSidebarDOM();
  if (!chatState.scrolledUp) scrollMessagesToBottom();
}

function replaceMessageDOM(messageId) {
  const conversation = chatState.activeConversation;
  const message = conversation?.messages.find((item) => item.id === messageId);
  const current = document.querySelector(`[data-chat-msg="${messageId}"]`);
  if (!conversation || !message || !current) return;
  const template = document.createElement('template');
  template.innerHTML = renderMessage(message, conversation).trim();
  const next = template.content.firstElementChild;
  if (!next) return;
  current.replaceWith(next);
  if (message.role === 'assistant' && message.content) document.getElementById(`chat-msg-content-${message.id}`)?.replaceChildren(renderMarkdownToDOM(message.content));
}

function syncDeleteModalDOM() {
  document.querySelector('.modal-backdrop:has(#chat-delete-title)')?.remove();
  if (!chatState.confirmDeleteId) return;
  const template = document.createElement('template');
  template.innerHTML = renderDeleteConfirm().trim();
  document.querySelector('.chat-page')?.append(template.content);
}

function setComposerDragState(active) {
  chatState.dragActive = active;
  const composer = document.getElementById('chat-composer-form');
  if (!composer) return;
  composer.classList.toggle('drag-active', active);
  composer.querySelector('.chat-drop-overlay')?.remove();
  if (active) composer.insertAdjacentHTML('afterbegin', `<div class="chat-drop-overlay">${icon('image', 20)}<span>${ct('dropHint')}</span></div>`);
}

// Sidebar-only state changes must not reconstruct the message thread or composer. Besides avoiding
// a visible flash, this preserves text selection, scroll position, uploads, and an in-flight stream.
function refreshSidebarDOM({ refocusSearch = false } = {}) {
  if (state.view !== 'chat') return;
  const current = document.querySelector('.chat-sidebar');
  if (!current) return;
  const template = document.createElement('template');
  template.innerHTML = renderSidebar().trim();
  const next = template.content.querySelector('.chat-sidebar');
  if (!next) return;
  current.replaceWith(next);
  if (refocusSearch) {
    const input = document.getElementById('chat-search-input');
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderChatPage() {
  if (!chatState.initialized && !chatState.loadingList) loadConversations().then(renderNow);
  const html = `
    <div class="chat-page" data-theme="${chatState.theme}" data-ai-available="${chatState.aiCapabilities.chatAvailable}">
      ${renderSidebar()}
      <div class="chat-sidebar-backdrop ${chatState.sidebarOpen ? 'visible' : ''}" data-chat-action="close-sidebar"></div>
      <div class="chat-main">
        ${renderChatHeader()}
        ${chatState.activeConversation && chatState.activeConversation.messages.length > 0 ? renderConversationBody() : renderChatWelcome()}
      </div>
    </div>`;
  queueMicrotask(() => {
    hydrateChatMessages();
    // A full re-render mid-stream mints a fresh, empty content element for the streaming bubble (see
    // renderMessage) — repaint it immediately with whatever has already arrived, so an unrelated action
    // (opening the sidebar, a rename elsewhere, ...) never shows a blank/reset bubble even for one frame.
    if (chatState.streaming) updateStreamingBubbleDOM();
    if (chatState.activeConversation && !chatState.scrolledUp) scrollMessagesToBottom();
  });
  return html;
}

function renderChatHeader() {
  const conversation = chatState.activeConversation;
  const title = conversation?.title || ct('chatWorkspace');
  const count = conversation?.messages?.length || 0;
  const available = chatState.aiCapabilities.chatAvailable;
  return `
    <header class="chat-main-header">
      <button class="chat-menu-toggle" data-chat-action="open-sidebar" aria-label="${ct('conversations')}">${icon('menu', 18)}</button>
      <div class="chat-header-copy"><strong>${esc(title)}</strong><span>${conversation ? `${count} ${ct('messagesLabel')}` : ct('welcomeBody')}</span></div>
      <div class="chat-ai-status ${available ? 'online' : 'offline'}"><i aria-hidden="true"></i><span>${available ? ct('assistantOnline') : ct('assistantOffline')}</span></div>
    </header>`;
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
  const visible = chatState.conversations.filter((item) => item.archived === chatState.showArchived && (!query || (item.title || '').toLowerCase().includes(query) || item.preview.toLowerCase().includes(query)));
  const pinned = visible.filter((item) => item.pinned);
  const rest = visible.filter((item) => !item.pinned);
  const activeCount = chatState.conversations.filter((item) => !item.archived).length;
  const archivedCount = chatState.conversations.filter((item) => item.archived).length;
  const available = chatState.aiCapabilities.chatAvailable;
  return `
    <aside class="chat-sidebar ${chatState.sidebarOpen ? 'open' : ''}" aria-label="${ct('history')}">
      <div class="chat-sidebar-head">
        <div class="chat-sidebar-brand"><span class="chat-sidebar-logo">${icon('spark', 17)}</span><span><strong>${ct('assistant')}</strong><small>${ct('chatWorkspace')}</small></span></div>
        <button class="icon-button chat-sidebar-close" data-chat-action="close-sidebar" aria-label="${lang() === 'en' ? 'Close' : 'إغلاق'}">${icon('close')}</button>
      </div>
      <button class="btn btn-primary btn-block chat-new-btn" data-chat-action="new-chat">${icon('plus', 15)}<span>${ct('newChat')}</span></button>
      <div class="chat-list-tabs" role="tablist" aria-label="${ct('history')}">
        <button role="tab" aria-selected="${!chatState.showArchived}" class="${!chatState.showArchived ? 'active' : ''}" data-chat-action="show-active">${ct('activeChats')}<span>${activeCount}</span></button>
        <button role="tab" aria-selected="${chatState.showArchived}" class="${chatState.showArchived ? 'active' : ''}" data-chat-action="show-archived">${ct('archived')}<span>${archivedCount}</span></button>
      </div>
      <div class="chat-search">${icon('search', 15)}<input type="search" id="chat-search-input" placeholder="${ct('search')}" value="${esc(chatState.search)}" aria-label="${ct('search')}">${chatState.search ? `<button data-chat-action="clear-search" aria-label="${ct('clearSearch')}">${icon('close', 13)}</button>` : ''}</div>
      <nav class="chat-conversation-list" aria-label="${ct('conversations')}">
        ${chatState.loadingList ? `<div class="chat-list-skeleton"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>` : ''}
        ${!chatState.loadingList && !visible.length ? `<div class="chat-empty-list">${icon(chatState.showArchived ? 'archive' : 'spark', 22)}<p>${query ? ct('noResults') : (chatState.showArchived ? ct('noArchived') : ct('noConversations'))}</p>${!query && !chatState.showArchived ? `<span>${ct('startHint')}</span>` : ''}</div>` : ''}
        ${pinned.length ? `<p class="chat-list-group">${ct('pinned')}</p>${pinned.map(renderConversationListItem).join('')}` : ''}
        ${rest.length ? `${pinned.length ? `<p class="chat-list-group">${ct('conversations')}</p>` : ''}${rest.map(renderConversationListItem).join('')}` : ''}
      </nav>
      <div class="chat-sidebar-footer">
        <div class="chat-sidebar-status ${available ? 'online' : 'offline'}"><i aria-hidden="true"></i><span><strong>${available ? ct('assistantOnline') : ct('assistantOffline')}</strong><small>${ct('responseTime')}</small></span></div>
        <button class="chat-theme-toggle" data-chat-action="toggle-theme" aria-pressed="${chatState.theme === 'dark'}" aria-label="${chatState.theme === 'dark' ? ct('lightMode') : ct('darkMode')}">
          ${chatState.theme === 'dark' ? icon('sun', 16) : icon('moon', 16)}<span>${chatState.theme === 'dark' ? ct('lightMode') : ct('darkMode')}</span>
        </button>
      </div>
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
        <form class="chat-rename-form" data-chat-rename-form="${item.id}"><input type="text" dir="auto" value="${esc(title)}" maxlength="80" autofocus id="chat-rename-input"></form>
      </div>`;
  }
  return `
    <div class="chat-conversation-item ${active ? 'active' : ''} ${menuOpen ? 'menu-open' : ''}" data-chat-open="${item.id}">
      <button class="chat-conversation-title" data-chat-open="${item.id}">
        <span class="chat-conversation-icon">${icon(item.archived ? 'archive' : 'spark', 14)}</span>
        <span class="chat-conversation-copy" dir="auto"><strong>${item.pinned ? `<i class="chat-pin-mark" aria-hidden="true">${icon('pin', 10)}</i>` : ''}${esc(title)}</strong><small>${esc(item.preview || ct('startHint'))}</small></span>
        <time datetime="${esc(item.updatedAt)}">${relativeConversationDate(item.updatedAt)}</time>
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
            <textarea id="chat-edit-textarea" dir="auto" maxlength="4000">${esc(message.content)}</textarea>
            <div class="chat-edit-actions"><button type="button" class="btn btn-ghost btn-sm" data-chat-action="cancel-edit">${ct('cancel')}</button><button type="submit" class="btn btn-primary btn-sm">${ct('save')}</button></div>
          </form>
        </div>`;
    }
    return `
      <div class="chat-msg chat-msg-user ${msgLangClass(message.language)} ${newestClass}" data-chat-msg="${message.id}" dir="${msgDir(message.language)}">
        <div class="chat-msg-bubble">
          ${message.attachment ? `<div class="chat-msg-attachment">${message.attachment.previewUrl ? `<img src="${esc(message.attachment.previewUrl)}" alt="${esc(message.attachment.name)}">` : message.attachment.attachmentId ? `<img src="/api/chat/attachments/${message.attachment.attachmentId}" alt="${esc(message.attachment.name)}">` : `<div class="chat-attachment-chip">${icon(message.attachment.kind === 'text' ? 'file' : 'image', 14)}<span>${esc(message.attachment.name)}</span></div>`}</div>` : ''}
          <div class="chat-msg-text" dir="auto">${esc(message.content)}</div>
        </div>
        <div class="chat-msg-actions">
          <button class="icon-button icon-button-sm" data-chat-action="edit-message" data-chat-id="${message.id}" aria-label="${ct('edit')}" title="${ct('edit')}">${icon('edit', 14)}</button>
          <button class="icon-button icon-button-sm" data-chat-action="copy" data-chat-copy="${message.id}" aria-label="${ct('copy')}" title="${ct('copy')}">${icon('copy', 14)}</button>
        </div>
      </div>`;
  }

  const isStreamingThis = chatState.streaming && message.id === chatState.streamAssistantId;
  const isGenerating = ['generating', 'continuing'].includes(message.status) || isStreamingThis;
  // A full re-render can happen for reasons unrelated to this message (opening the sidebar, renaming a
  // different conversation, a window resize, ...) while this one is still actively streaming. The
  // message array's own content/thinking only get written once at the very end (see sendChat's 'done'
  // handler) — reading them here mid-stream would repaint the bubble back to blank/placeholder and,
  // worse, re-mint its DOM ids from message.id, which no longer matches the frozen streamDomId the hot
  // loop (updateStreamingBubbleDOM) looks up by. Both would silently stop all further live updates until
  // the response finishes. Reading the live buffer + frozen id here instead makes every full re-render
  // mid-stream a no-op for this bubble's correctness, not a source of lost progress.
  const domId = isStreamingThis ? chatState.streamDomId : message.id;
  const liveContent = isStreamingThis ? chatState.streamContent : message.content;
  const liveThinking = isStreamingThis ? chatState.streamThinking : message.thinking;
  const hasThinking = Boolean(liveThinking && liveThinking.length);
  // A message generated with Thinking mode on shows its reasoning panel from the very first render —
  // OPEN, with a live "thinking…" indicator in the summary — not only once actual reasoning text has
  // streamed in. thinkingRequested is set at message-creation time (see sendChat), before this first
  // render happens, specifically so the panel is already in the DOM ready to receive the hot loop's
  // surgical text updates the instant they arrive, instead of appearing only after some delay.
  const willThink = Boolean(message.thinkingRequested) || hasThinking;
  const showReasoningBlock = isGenerating ? willThink : hasThinking;
  const showThinkingPlaceholder = isGenerating && willThink && !hasThinking;
  const showTyping = isGenerating && !liveContent && !willThink;
  const timing = message.timing;
  const rating = timing ? speedRating(timing.firstResponseMs) : null;
  const liveLanguage = isStreamingThis ? chatState.streamLanguage : (message.language || 'ar');
  return `
    <div class="chat-msg chat-msg-assistant ${msgLangClass(liveLanguage)} ${isStreamingThis ? 'is-streaming' : ''} ${newestClass}" data-chat-msg="${domId}" dir="${msgDir(liveLanguage)}">
      <div class="chat-msg-avatar" aria-hidden="true">${icon('spark', 15)}</div>
      <div class="chat-msg-bubble">
        ${showReasoningBlock ? `
          <details class="chat-reasoning" id="chat-reasoning-${domId}" ${isStreamingThis ? 'open' : ''}>
            <summary>${icon('node', 13)}<span>${ct('reasoning')}</span><span class="chat-reasoning-live" id="chat-reasoning-live-${domId}" style="${showThinkingPlaceholder ? '' : 'display:none'}"><i></i><i></i><i></i></span></summary>
            <p class="chat-reasoning-hint">${ct('reasoningHint')}</p>
            <div class="chat-reasoning-text" id="chat-msg-thinking-${domId}" dir="${msgDir(liveLanguage)}">${esc(liveThinking || '')}</div>
          </details>` : ''}
        <div class="chat-typing" id="chat-msg-typing-${domId}" style="${showTyping ? '' : 'display:none'}"><span></span><span></span><span></span></div>
        <div class="chat-msg-text" id="chat-msg-content-${domId}" dir="${msgDir(liveLanguage)}"></div>
        ${message.status === 'failed' ? `<p class="chat-msg-flag is-recoverable">${icon('warning', 13)}<span>${ct('continuationFailed')}</span></p>` : message.unavailable ? `<p class="chat-msg-flag">${icon('warning', 13)}<span>${ct('unavailable')}</span></p>` : ''}
        ${message.stopped ? `<p class="chat-msg-flag">${ct('stopped')}</p>` : ''}
        ${message.aiGenerated ? `<p class="chat-ai-disclosure">${ct('aiDraft')}</p>` : ''}
        ${timing && !isGenerating ? `<div class="chat-response-metrics" title="${ct('responseTime')}">
          <span class="chat-speed-rating ${rating?.className || ''}"><i></i>${rating?.label || ''}</span>
          <span>${ct('firstToken')}: <b>${formatDuration(timing.firstResponseMs)}</b></span>
          <span>${ct('totalTime')}: <b>${formatDuration(timing.totalMs)}</b></span>
        </div>` : ''}
      </div>
      ${!isGenerating ? `
        <div class="chat-msg-actions">
          <button class="icon-button icon-button-sm" data-chat-action="copy" data-chat-copy="${message.id}" aria-label="${ct('copy')}" title="${ct('copy')}">${icon('copy', 14)}</button>
          ${isLast && ['stopped', 'failed'].includes(message.status) && message.content ? `<button class="icon-button icon-button-sm chat-continue-inline" data-chat-action="continue" data-chat-id="${message.id}" aria-label="${message.status === 'failed' ? ct('retryContinue') : ct('continueResponse')}" title="${message.status === 'failed' ? ct('retryContinue') : ct('continueResponse')}">${icon('continue', 14)}</button>` : ''}
          ${isLast ? `<button class="icon-button icon-button-sm" data-chat-action="regenerate" aria-label="${ct('regenerate')}" title="${ct('regenerate')}">${icon('refresh', 14)}</button>` : ''}
        </div>` : ''}
    </div>`;
}

function renderComposer(inWelcome) {
  const attachment = chatState.composerAttachment;
  const canThink = chatState.aiCapabilities.thinkingSupported;
  const lastMessage = chatState.activeConversation?.messages?.at(-1);
  const canContinue = Boolean(lastMessage?.role === 'assistant' && ['stopped', 'failed'].includes(lastMessage.status) && lastMessage.content);
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
        <textarea id="chat-composer-input" class="chat-composer-input" dir="auto" placeholder="${canThink && chatState.thinkingMode ? ct('placeholderThinking') : ct('placeholder')}" rows="1" maxlength="4000"></textarea>
        ${chatState.streaming
          ? `<button type="button" class="chat-send-btn is-stop" data-chat-action="stop" aria-label="${ct('stop')}" title="${ct('stop')}">${icon('stop', 15)}</button>`
          : canContinue
            ? `<button type="button" class="chat-send-btn is-continue" data-chat-action="continue" data-chat-id="${lastMessage.id}" aria-label="${lastMessage.status === 'failed' ? ct('retryContinue') : ct('continueResponse')}" title="${lastMessage.status === 'failed' ? ct('retryContinue') : ct('continueResponse')}">${icon('continue', 16)}</button>`
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
    refreshSidebarDOM();
    // fall through: this same click may still need normal handling (e.g. it opened a different row)
  }

  // app.js's own generic backdrop-click handler already removes the .modal-backdrop DOM node (it
  // doesn't know about chat.js state) — checking classList directly here (not .closest(), which can
  // break once that removal has already detached the node from the tree) keeps chatState in sync
  // regardless of which of the two listeners happens to run first.
  if (event.target.classList.contains('modal-backdrop') && chatState.confirmDeleteId) {
    chatState.confirmDeleteId = null;
    syncDeleteModalDOM();
    return;
  }

  // Action buttons (pin/rename/archive/delete/...) live nested inside a conversation row that is
  // itself openable — this check must come first, or every click on those buttons would bubble into
  // the row's own data-chat-open handler below and just re-open the conversation instead.
  const actionControl = event.target.closest('[data-chat-action]');
  const action = actionControl?.dataset.chatAction;
  const actionId = actionControl?.dataset.chatId || actionControl?.closest('.chat-conversation-item')?.dataset.chatOpen;

  if (!action) {
    const openItem = event.target.closest('[data-chat-open]');
    if (openItem) { openConversation(openItem.dataset.chatOpen); chatState.sidebarOpen = window.innerWidth > 900; return; }

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
  if (action === 'show-active' || action === 'show-archived') {
    chatState.showArchived = action === 'show-archived';
    chatState.openMenuId = null;
    refreshSidebarDOM();
    return;
  }
  if (action === 'clear-search') { chatState.search = ''; refreshSidebarDOM({ refocusSearch: true }); return; }
  // These four are purely cosmetic, page-local toggles — routing them through the app's normal full
  // renderNow() (a whole-page innerHTML replace) was overkill even at rest, and actively harmful mid-
  // stream: it re-mints every element (including the streaming bubble's, restarting entrance animations
  // and visibly flashing the entire page) and, before the renderMessage fix above, could silently break
  // the rest of the live response. Mutating the DOM directly here touches nothing but the toggle itself.
  if (action === 'open-sidebar' || action === 'close-sidebar') {
    chatState.sidebarOpen = action === 'open-sidebar';
    document.querySelector('.chat-sidebar')?.classList.toggle('open', chatState.sidebarOpen);
    document.querySelector('.chat-sidebar-backdrop')?.classList.toggle('visible', chatState.sidebarOpen);
    return;
  }
  if (action === 'toggle-theme') {
    chatState.theme = chatState.theme === 'dark' ? 'light' : 'dark';
    saveChatTheme(chatState.theme);
    document.querySelector('.chat-page')?.setAttribute('data-theme', chatState.theme);
    const themeBtn = document.querySelector('.chat-theme-toggle');
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(chatState.theme === 'dark'));
      themeBtn.innerHTML = `${chatState.theme === 'dark' ? icon('sun', 15) : icon('moon', 15)}<span>${chatState.theme === 'dark' ? ct('lightMode') : ct('darkMode')}</span>`;
    }
    return;
  }
  if (action === 'toggle-thinking') {
    chatState.thinkingMode = !chatState.thinkingMode;
    const thinkBtn = document.querySelector('.chat-thinking-btn');
    if (thinkBtn) { thinkBtn.classList.toggle('on', chatState.thinkingMode); thinkBtn.setAttribute('aria-checked', String(chatState.thinkingMode)); }
    const composerInput = document.getElementById('chat-composer-input');
    if (composerInput) composerInput.placeholder = chatState.aiCapabilities.thinkingSupported && chatState.thinkingMode ? ct('placeholderThinking') : ct('placeholder');
    return;
  }
  if (action === 'toggle-menu') { chatState.openMenuId = chatState.openMenuId === actionId ? null : actionId; refreshSidebarDOM(); return; }
  if (action === 'pin') return patchConversation(actionId, { pinned: !chatState.conversations.find((item) => item.id === actionId)?.pinned });
  if (action === 'archive') {
    chatState.openMenuId = null;
    const item = chatState.conversations.find((entry) => entry.id === actionId);
    if (!item) return;
    return patchConversation(actionId, { archived: item.archived !== true });
  }
  if (action === 'rename') { chatState.openMenuId = null; chatState.renamingId = actionId; refreshSidebarDOM(); document.getElementById('chat-rename-input')?.focus(); return; }
  if (action === 'delete') { chatState.openMenuId = null; chatState.confirmDeleteId = actionId; refreshSidebarDOM(); syncDeleteModalDOM(); return; }
  if (action === 'cancel-delete') { chatState.confirmDeleteId = null; syncDeleteModalDOM(); return; }
  if (action === 'confirm-delete') return deleteConversation(actionId);
  if (action === 'remove-attachment') { chatState.composerAttachment = null; chatState.attachmentError = null; refreshComposerDOM({ focus: true }); return; }
  if (action === 'stop') return stopStreaming();
  if (action === 'continue') {
    const input = document.getElementById('chat-composer-input');
    const content = input?.value.trim() || '';
    if (content || chatState.composerAttachment) {
      if (input) input.value = '';
      return sendChat({ content });
    }
    return sendChat({ continueMessageId: actionId });
  }
  if (action === 'scroll-bottom') { chatState.scrolledUp = false; scrollMessagesToBottom(); event.target.closest('.chat-scroll-bottom')?.classList.remove('visible'); return; }
  if (action === 'regenerate') return sendChat({ regenerate: true });
  if (action === 'edit-message') {
    const message = chatState.activeConversation?.messages.find((item) => item.id === actionId);
    chatState.editingMessageId = actionId;
    replaceMessageDOM(actionId);
    const textarea = document.getElementById('chat-edit-textarea');
    if (textarea) { textarea.focus(); textarea.setSelectionRange(textarea.value.length, textarea.value.length); }
    return;
  }
  if (action === 'cancel-edit') { const id = chatState.editingMessageId; chatState.editingMessageId = null; if (id) replaceMessageDOM(id); return; }
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
    else refreshSidebarDOM();
    return;
  }
  const editForm = event.target.closest('[data-chat-edit-form]');
  if (editForm) {
    event.preventDefault();
    const messageId = editForm.dataset.chatEditForm;
    const newText = editForm.querySelector('textarea')?.value.trim();
    chatState.editingMessageId = null;
    if (newText) sendChat({ content: newText, editFromMessageId: messageId });
    else replaceMessageDOM(messageId);
    return;
  }
});

document.addEventListener('input', (event) => {
  if (event.target.id === 'chat-search-input') { chatState.search = event.target.value; refreshSidebarDOM({ refocusSearch: true }); return; }
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
  if (event.key === 'Escape' && chatState.confirmDeleteId) { chatState.confirmDeleteId = null; syncDeleteModalDOM(); }
  if (event.key === 'Escape' && chatState.openMenuId) { chatState.openMenuId = null; refreshSidebarDOM(); }
  if (event.key === 'Escape' && chatState.sidebarOpen && window.innerWidth <= 900) {
    chatState.sidebarOpen = false;
    document.querySelector('.chat-sidebar')?.classList.remove('open');
    document.querySelector('.chat-sidebar-backdrop')?.classList.remove('visible');
  }
});

window.addEventListener('resize', () => {
  if (state.view !== 'chat') return;
  const shouldOpen = window.innerWidth > 900;
  if (shouldOpen !== chatState.sidebarOpen) {
    chatState.sidebarOpen = shouldOpen;
    document.querySelector('.chat-sidebar')?.classList.toggle('open', shouldOpen);
    document.querySelector('.chat-sidebar-backdrop')?.classList.toggle('visible', shouldOpen && window.innerWidth <= 900);
  }
});

document.addEventListener('scroll', (event) => {
  if (event.target.id !== 'chat-messages') return;
  const el = event.target;
  chatState.scrolledUp = el.scrollHeight - el.scrollTop - el.clientHeight > 120;
}, true);

document.addEventListener('dragover', (event) => {
  if (!event.target.closest('.chat-composer')) return;
  event.preventDefault();
  if (!chatState.dragActive) setComposerDragState(true);
});
document.addEventListener('dragleave', (event) => {
  if (!event.target.closest('.chat-composer')) return;
  setComposerDragState(false);
});
document.addEventListener('drop', (event) => {
  if (!event.target.closest('.chat-composer')) return;
  event.preventDefault();
  setComposerDragState(false);
  const file = event.dataTransfer?.files?.[0];
  if (file) attachFile(file);
});

export { renderChatPage };
