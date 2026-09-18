// Shared, dependency-free language detection between Arabic and the app's secondary language
// (English) for the AI Chat page. Pure JS with no DOM/Node-only APIs, so it is imported verbatim by
// both the server (system-prompt construction — see server.mjs's chatSystemPrompt/buildChatOllamaMessages)
// and the browser client (immediate, no-round-trip direction/typography selection — see chat.js).
// Both sides always agree because they run the exact same function on the exact same text, not
// because either one waits on or trusts the other.

const ARABIC_SCRIPT_RE = /[؀-ۿݐ-ݿࡰ-࢟ࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const LATIN_LETTER_RE = /[A-Za-z]/g;

const MIN_SIGNAL_CHARS = 3;
const ARABIC_DOMINANT_RATIO = 0.6;
const LATIN_DOMINANT_RATIO = 0.35;

// Strips the parts of a message that carry no real conversational-language signal — fenced/inline
// code, URLs, emails, and bare filenames — so a short Arabic question that merely mentions "React.js"
// or "main.py" isn't misread as English just because those tokens are Latin script.
function stripNonProse(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[\w-]{2,}@[\w.-]+/g, ' ')
    .replace(/[\w.-]+\.(js|jsx|ts|tsx|py|json|txt|md|html?|css|c|cpp|h|hpp|java|rb|go|rs|sql|sh|ya?ml|log|csv|xml|ipynb)\b/gi, ' ');
}

// Returns 'ar' | 'en' | null. null means this text alone doesn't carry enough or clear enough
// signal to decide (too short, mostly code/identifiers, or genuinely mixed with neither script
// dominant) — the caller should fall back to recent conversation context, then finally to the app's
// Arabic default, rather than treating null as "assume English."
function detectTextLanguage(text) {
  const prose = stripNonProse(text);
  const arabic = (prose.match(ARABIC_SCRIPT_RE) || []).length;
  const latin = (prose.match(LATIN_LETTER_RE) || []).length;
  const total = arabic + latin;
  if (total < MIN_SIGNAL_CHARS) return null;
  const arabicRatio = arabic / total;
  if (arabicRatio >= ARABIC_DOMINANT_RATIO) return 'ar';
  if (arabicRatio <= LATIN_DOMINANT_RATIO) return 'en';
  return null;
}

// Walks the most recent user messages, newest first, returning the first confident detection. This
// is what lets a short reply like "ok" or a lone filename inherit the conversation's already-
// established language instead of bouncing back to the app default on every low-signal turn, while a
// clear language switch (a whole new message confidently in the other script) still wins immediately
// since it's checked first.
function detectConversationLanguage(recentUserTexts, fallback = 'ar') {
  for (let i = recentUserTexts.length - 1; i >= 0; i--) {
    const lang = detectTextLanguage(recentUserTexts[i]);
    if (lang) return lang;
  }
  return fallback;
}

export { detectTextLanguage, detectConversationLanguage };
