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
    placeholder: 'اكتب رسالتك…', send: 'إرسال', stop: 'إيقاف', thinking: 'تفكير عميق', reasoning: 'التفكير', reasoningHint: 'خطوات تفكير المساعد — ليست الإجابة النهائية.',
    attach: 'إرفاق صورة', remove: 'إزالة', rename: 'إعادة تسمية', pin: 'تثبيت', unpin: 'إلغاء التثبيت', archive: 'أرشفة', unarchive: 'إلغاء الأرشفة', delete: 'حذف',
    confirmDeleteTitle: 'حذف المحادثة؟', confirmDeleteBody: 'سيتم حذف هذه المحادثة وكل رسائلها نهائيًا.', cancel: 'إلغاء', regenerate: 'إعادة توليد', copy: 'نسخ', copied: 'تم النسخ',
    edit: 'تعديل', save: 'حفظ', aiDraft: 'مسودة ذكاء اصطناعي', stopped: 'تم الإيقاف', unavailable: 'المساعد غير متاح الآن',
    imageRejected: 'الملفات غير الصورية غير مدعومة.', imageTooLarge: 'حجم الصورة كبير جدًا.', contextDivider: 'الرسائل الأقدم غير متاحة لذاكرة المساعد في هذا الرد.',
    lightMode: 'وضع فاتح', darkMode: 'وضع داكن', you: 'أنت', assistant: 'المساعد', unavailableChip: 'الدردشة الذكية غير مفعّلة على هذه النسخة بعد.',
    dropHint: 'أفلت الصورة هنا', newMessages: 'رسائل جديدة ↓',
  },
  en: {
    newChat: 'New chat', search: 'Search conversations…', pinned: 'Pinned', conversations: 'Conversations',
    noConversations: 'No conversations yet', noResults: 'No matching conversations', startHint: 'Start a new one above.',
    welcomeTitle: 'Hi — what can I help you with?', welcomeBody: 'Ask about any study topic, request an explanation, or work through a problem step by step.',
    suggestion1: 'Explain average speed with a worked example', suggestion2: 'Help me understand distance-time graphs', suggestion3: 'How should I revise for tomorrow’s test?',
    placeholder: 'Write your message…', send: 'Send', stop: 'Stop', thinking: 'Deep thinking', reasoning: 'Reasoning', reasoningHint: 'The assistant’s thinking steps — not the final answer.',
    attach: 'Attach image', remove: 'Remove', rename: 'Rename', pin: 'Pin', unpin: 'Unpin', archive: 'Archive', unarchive: 'Unarchive', delete: 'Delete',
    confirmDeleteTitle: 'Delete this conversation?', confirmDeleteBody: 'This conversation and all its messages will be permanently deleted.', cancel: 'Cancel', regenerate: 'Regenerate', copy: 'Copy', copied: 'Copied',
    edit: 'Edit', save: 'Save', aiDraft: 'AI draft', stopped: 'Stopped', unavailable: 'The assistant is unavailable right now',
    imageRejected: 'Non-image files are not supported.', imageTooLarge: 'That image is too large.', contextDivider: 'Earlier messages aren’t included in the assistant’s memory for this reply.',
    lightMode: 'Light mode', darkMode: 'Dark mode', you: 'You', assistant: 'Assistant', unavailableChip: 'AI Chat is not set up on this deployment yet.',
    dropHint: 'Drop image here', newMessages: 'New messages ↓',
  },
};
const ct = (key) => copy[lang()]?.[key] || copy.ar[key] || key;

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
  streaming: false, streamAbort: null, streamAssistantId: null, streamContent: '', streamThinking: '',
  editingMessageId: null, renamingId: null, confirmDeleteId: null, dragActive: false,
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
          resolve({ dataBase64, type: 'image/jpeg', name: file.name, size: blob.size, previewUrl: URL.createObjectURL(blob) });
        };
        blobReader.readAsDataURL(blob);
      }, 'image/jpeg', 0.85);
    };
    reader.readAsDataURL(file);
  });
}

async function attachImageFile(file) {
  chatState.attachmentError = null;
  if (!file.type.startsWith('image/')) { chatState.attachmentError = ct('imageRejected'); renderNow(); return; }
  if (file.size > MAX_ATTACHMENT_BYTES * 4) { chatState.attachmentError = ct('imageTooLarge'); renderNow(); return; }
  try {
    const resized = await resizeImageFile(file);
    chatState.composerAttachment = resized;
  } catch {
    chatState.attachmentError = ct('imageTooLarge');
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
  const idempotencyKey = id();

  if (!regenerate) {
    if (editFromMessageId) {
      const cutIndex = conversation.messages.findIndex((message) => message.id === editFromMessageId);
      if (cutIndex >= 0) conversation.messages = conversation.messages.slice(0, cutIndex);
    }
    conversation.messages.push({
      id: `pending-${idempotencyKey}`, role: 'user', content,
      attachment: attachment ? { name: attachment.name, type: attachment.type, size: attachment.size, previewUrl: attachment.previewUrl } : null,
      createdAt: new Date().toISOString(),
    });
  } else {
    const lastIndex = conversation.messages.length - 1;
    if (lastIndex >= 0 && conversation.messages[lastIndex].role === 'assistant') conversation.messages = conversation.messages.slice(0, lastIndex);
  }
  const placeholderId = `pending-assistant-${idempotencyKey}`;
  conversation.messages.push({ id: placeholderId, role: 'assistant', content: '', thinking: '', status: 'generating' });

  chatState.composerAttachment = null;
  chatState.attachmentError = null;
  chatState.streaming = true;
  chatState.streamAssistantId = placeholderId;
  chatState.streamContent = '';
  chatState.streamThinking = '';
  chatState.scrolledUp = false;
  renderNow();
  scrollMessagesToBottom();

  const controller = new AbortController();
  chatState.streamAbort = controller;

  const body = { idempotencyKey, regenerate, editFromMessageId };
  if (!regenerate) body.content = content;
  if (attachment) body.attachment = { name: attachment.name, type: attachment.type, dataBase64: attachment.dataBase64 };
  if (chatState.thinkingMode && chatState.aiCapabilities.thinkingSupported) body.thinking = true;

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

// Hot-loop DOM update: plain text on every token (cheap, always correct), a full Markdown re-render
// at most every ~250ms so formatting appears progressively without re-parsing on every character.
let lastMarkdownRenderAt = 0;
function updateStreamingBubbleDOM() {
  const contentEl = document.getElementById(`chat-msg-content-${chatState.streamAssistantId}`);
  if (contentEl) contentEl.textContent = chatState.streamContent;
  const thinkingEl = document.getElementById(`chat-msg-thinking-${chatState.streamAssistantId}`);
  if (thinkingEl) thinkingEl.textContent = chatState.streamThinking;
  const now = performance.now();
  if (contentEl && now - lastMarkdownRenderAt > 250) {
    lastMarkdownRenderAt = now;
    contentEl.replaceChildren(renderMarkdownToDOM(chatState.streamContent));
  }
  if (!chatState.scrolledUp) scrollMessagesToBottom();
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
      <div class="chat-main">
        ${chatState.activeConversation ? renderConversationBody() : renderChatWelcome()}
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
        <button class="btn btn-primary btn-block" data-chat-action="new-chat">+ ${ct('newChat')}</button>
        <button class="icon-button chat-sidebar-close" data-chat-action="close-sidebar" aria-label="${lang() === 'en' ? 'Close' : 'إغلاق'}">✕</button>
      </div>
      <div class="chat-search"><input type="search" id="chat-search-input" placeholder="${ct('search')}" value="${esc(chatState.search)}" aria-label="${ct('search')}"></div>
      <nav class="chat-conversation-list" aria-label="${ct('conversations')}">
        ${chatState.loadingList ? `<div class="chat-list-skeleton"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>` : ''}
        ${!chatState.loadingList && !visible.length ? `<p class="chat-empty-list">${query ? ct('noResults') : ct('noConversations')}</p>` : ''}
        ${pinned.length ? `<p class="chat-list-group">${ct('pinned')}</p>${pinned.map(renderConversationListItem).join('')}` : ''}
        ${rest.length ? `${pinned.length ? `<p class="chat-list-group">${ct('conversations')}</p>` : ''}${rest.map(renderConversationListItem).join('')}` : ''}
      </nav>
      <button class="chat-theme-toggle" data-chat-action="toggle-theme" aria-pressed="${chatState.theme === 'dark'}">
        ${chatState.theme === 'dark' ? `☀ ${ct('lightMode')}` : `☾ ${ct('darkMode')}`}
      </button>
    </aside>
    ${chatState.confirmDeleteId ? renderDeleteConfirm() : ''}`;
}

function renderConversationListItem(item) {
  const active = item.id === chatState.activeId;
  const title = item.title || ct('newChat');
  return `
    <div class="chat-conversation-item ${active ? 'active' : ''}" data-chat-open="${item.id}">
      ${chatState.renamingId === item.id
        ? `<form class="chat-rename-form" data-chat-rename-form="${item.id}"><input type="text" value="${esc(title)}" maxlength="80" autofocus id="chat-rename-input"></form>`
        : `<button class="chat-conversation-title" data-chat-open="${item.id}">${esc(title)}</button>`}
      <div class="chat-conversation-actions">
        <button class="icon-button icon-button-sm" data-chat-action="pin" data-chat-id="${item.id}" aria-label="${item.pinned ? ct('unpin') : ct('pin')}" title="${item.pinned ? ct('unpin') : ct('pin')}">${item.pinned ? '★' : '☆'}</button>
        <button class="icon-button icon-button-sm" data-chat-action="rename" data-chat-id="${item.id}" aria-label="${ct('rename')}" title="${ct('rename')}">✎</button>
        <button class="icon-button icon-button-sm" data-chat-action="archive" data-chat-id="${item.id}" aria-label="${item.archived ? ct('unarchive') : ct('archive')}" title="${item.archived ? ct('unarchive') : ct('archive')}">🗃</button>
        <button class="icon-button icon-button-sm" data-chat-action="delete" data-chat-id="${item.id}" aria-label="${ct('delete')}" title="${ct('delete')}">🗑</button>
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
    <button class="chat-menu-toggle" data-chat-action="open-sidebar" aria-label="${lang() === 'en' ? 'Conversations' : 'المحادثات'}">☰</button>
    <div class="chat-welcome">
      <div class="chat-welcome-mark">✧</div>
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
    <button class="chat-menu-toggle" data-chat-action="open-sidebar" aria-label="${lang() === 'en' ? 'Conversations' : 'المحادثات'}">☰</button>
    <div class="chat-messages" id="chat-messages">
      ${conversation.messages.map((message, index) => `${index === dividerIndex ? `<div class="chat-context-divider"><span>${ct('contextDivider')}</span></div>` : ''}${renderMessage(message, conversation)}`).join('')}
    </div>
    <button class="chat-scroll-bottom ${chatState.scrolledUp ? 'visible' : ''}" data-chat-action="scroll-bottom">${ct('newMessages')}</button>
    ${renderComposer(false)}`;
}

function renderMessage(message, conversation) {
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
      <div class="chat-msg chat-msg-user" data-chat-msg="${message.id}">
        <div class="chat-msg-bubble">
          ${message.attachment ? `<div class="chat-msg-attachment">${message.attachment.previewUrl ? `<img src="${esc(message.attachment.previewUrl)}" alt="${esc(message.attachment.name)}">` : message.attachment.attachmentId ? `<img src="/api/chat/attachments/${message.attachment.attachmentId}" alt="${esc(message.attachment.name)}">` : `<div class="chat-attachment-chip">🖼 ${esc(message.attachment.name)}</div>`}</div>` : ''}
          <div class="chat-msg-text">${esc(message.content)}</div>
        </div>
        <div class="chat-msg-actions">
          <button class="icon-button icon-button-sm" data-chat-action="edit-message" data-chat-id="${message.id}" aria-label="${ct('edit')}" title="${ct('edit')}">✎</button>
          <button class="icon-button icon-button-sm" data-chat-action="copy" data-chat-copy="${message.id}" aria-label="${ct('copy')}" title="${ct('copy')}">⧉</button>
        </div>
      </div>`;
  }

  const isStreamingThis = chatState.streaming && message.id === chatState.streamAssistantId;
  const isGenerating = message.status === 'generating' || isStreamingThis;
  const hasThinking = Boolean(message.thinking && message.thinking.length);
  const isLast = conversation.messages[conversation.messages.length - 1]?.id === message.id;
  return `
    <div class="chat-msg chat-msg-assistant" data-chat-msg="${message.id}">
      <div class="chat-msg-avatar" aria-hidden="true">✧</div>
      <div class="chat-msg-bubble">
        ${hasThinking ? `
          <details class="chat-reasoning" ${isStreamingThis ? 'open' : ''}>
            <summary>${ct('reasoning')}</summary>
            <p class="chat-reasoning-hint">${ct('reasoningHint')}</p>
            <div class="chat-reasoning-text" id="chat-msg-thinking-${message.id}">${esc(message.thinking)}</div>
          </details>` : ''}
        ${isGenerating && !message.content ? `<div class="chat-typing"><span></span><span></span><span></span></div>` : `<div class="chat-msg-text" id="chat-msg-content-${message.id}"></div>`}
        ${message.unavailable ? `<p class="chat-msg-flag">⚠ ${ct('unavailable')}</p>` : ''}
        ${message.stopped ? `<p class="chat-msg-flag">${ct('stopped')}</p>` : ''}
        ${message.aiGenerated ? `<p class="chat-ai-disclosure">${ct('aiDraft')}</p>` : ''}
      </div>
      ${!isGenerating ? `
        <div class="chat-msg-actions">
          <button class="icon-button icon-button-sm" data-chat-action="copy" data-chat-copy="${message.id}" aria-label="${ct('copy')}" title="${ct('copy')}">⧉</button>
          ${isLast ? `<button class="icon-button icon-button-sm" data-chat-action="regenerate" aria-label="${ct('regenerate')}" title="${ct('regenerate')}">↻</button>` : ''}
        </div>` : ''}
    </div>`;
}

function renderComposer(inWelcome) {
  const attachment = chatState.composerAttachment;
  const canThink = chatState.aiCapabilities.thinkingSupported;
  return `
    <form class="chat-composer ${chatState.dragActive ? 'drag-active' : ''}" id="chat-composer-form">
      ${chatState.dragActive ? `<div class="chat-drop-overlay">${ct('dropHint')}</div>` : ''}
      ${attachment ? `<div class="chat-composer-attachment"><img src="${esc(attachment.previewUrl)}" alt=""><button type="button" class="icon-button icon-button-sm" data-chat-action="remove-attachment" aria-label="${ct('remove')}">✕</button></div>` : ''}
      ${chatState.attachmentError ? `<p class="chat-attachment-error">${esc(chatState.attachmentError)}</p>` : ''}
      <div class="chat-composer-row">
        <label class="icon-button chat-attach-button" title="${ct('attach')}"><input type="file" accept="image/*" id="chat-file-input" hidden>📎</label>
        <textarea id="chat-composer-input" class="chat-composer-input" placeholder="${ct('placeholder')}" rows="1" maxlength="4000"></textarea>
        ${canThink ? `<button type="button" class="chat-thinking-toggle ${chatState.thinkingMode ? 'on' : ''}" data-chat-action="toggle-thinking" aria-pressed="${chatState.thinkingMode}" title="${ct('thinking')}">🧠</button>` : ''}
        ${chatState.streaming ? `<button type="button" class="btn btn-primary chat-send-btn" data-chat-action="stop">${ct('stop')}</button>` : `<button type="submit" class="btn btn-primary chat-send-btn">${ct('send')}</button>`}
      </div>
    </form>${inWelcome ? '' : ''}`;
}

// ---------------------------------------------------------------------------
// Event wiring — all scoped to the Chat page, coexisting harmlessly with app.js's own delegated
// listeners (different attribute namespace: data-chat-*, never data-action/data-view).
// ---------------------------------------------------------------------------

document.addEventListener('click', async (event) => {
  if (state.view !== 'chat' && !event.target.closest('.chat-page')) return;

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
  if (action === 'pin') return patchConversation(actionId, { pinned: !chatState.conversations.find((item) => item.id === actionId)?.pinned });
  if (action === 'archive') return patchConversation(actionId, { archived: !chatState.conversations.find((item) => item.id === actionId)?.archived });
  if (action === 'rename') { chatState.renamingId = actionId; renderNow(); document.getElementById('chat-rename-input')?.focus(); return; }
  if (action === 'delete') { chatState.confirmDeleteId = actionId; renderNow(); return; }
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
  if (event.target.id === 'chat-file-input' && event.target.files?.[0]) { attachImageFile(event.target.files[0]); event.target.value = ''; }
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
  if (file) attachImageFile(file);
  else renderNow();
});

export { renderChatPage };
