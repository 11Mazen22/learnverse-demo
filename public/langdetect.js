// Shared Arabic/English conversation-language detection for both the server and browser.
// It intentionally scores conversational words, not raw bytes: code, filenames, product names,
// commands, and identifiers must not overpower the language the student is actually speaking.

const ARABIC_WORD_RE = /[؀-ۿݐ-ݿࡰ-࢟ࢠ-ࣿﭐ-﷿ﹰ-﻿]+/g;
const LATIN_WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g;
const ARABIC_CHARS_RE = /[؀-ۿݐ-ݿࡰ-࢟ࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const LATIN_CHARS_RE = /[A-Za-z]/g;

const TECHNICAL_TERMS = new Set([
  'ai', 'api', 'css', 'csv', 'docker', 'git', 'github', 'html', 'http', 'https', 'javascript',
  'json', 'jsx', 'llm', 'node', 'npm', 'ollama', 'openai', 'python', 'qwen', 'railway', 'react',
  'sql', 'supabase', 'typescript', 'tsx', 'ui', 'url', 'ux', 'xml', 'yaml',
]);

const ARABIC_SWITCH_RE = /(?:بالعربية|باللغة\s+العربية|اكتب\s+بالعربية|أجب\s+بالعربية|تكلم\s+بالعربية|العربي(?:ة)?\s+من\s+فضلك)/i;
const ENGLISH_SWITCH_RE = /(?:\bin\s+english\b|\benglish\s+please\b|\banswer\s+in\s+english\b|\brespond\s+in\s+english\b|\bspeak\s+english\b)/i;

function stripNonProse(text) {
  return String(text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[\w-]{2,}@[\w.-]+/g, ' ')
    .replace(/(?:^|\s)(?:--?[\w-]+|\/[\w./-]+|[\w@-]+\/[\w@./-]+)(?=\s|$)/g, ' ')
    .replace(/[\w.-]+\.(?:js|jsx|ts|tsx|py|json|txt|md|html?|css|c|cpp|h|hpp|java|rb|go|rs|sql|sh|ya?ml|log|csv|xml|ipynb)\b/gi, ' ');
}

function languageSignal(text) {
  const source = String(text || '');
  if (ARABIC_SWITCH_RE.test(source)) return { language: 'ar', explicit: true, words: 4, strength: 1 };
  if (ENGLISH_SWITCH_RE.test(source)) return { language: 'en', explicit: true, words: 4, strength: 1 };

  const prose = stripNonProse(source);
  const arabicWords = prose.match(ARABIC_WORD_RE) || [];
  const latinWords = (prose.match(LATIN_WORD_RE) || []).filter((word) => {
    const normalized = word.toLowerCase();
    return !TECHNICAL_TERMS.has(normalized) && !(word.length > 1 && word === word.toUpperCase());
  });
  const arabicChars = (arabicWords.join('').match(ARABIC_CHARS_RE) || []).length;
  const latinChars = (latinWords.join('').match(LATIN_CHARS_RE) || []).length;
  const words = arabicWords.length + latinWords.length;
  const chars = arabicChars + latinChars;
  if (chars < 3 || words === 0) return null;

  if (!latinWords.length) return { language: 'ar', explicit: false, words, strength: 1 };
  if (!arabicWords.length) {
    if (latinChars < 4) return null;
    return { language: 'en', explicit: false, words, strength: 1 };
  }

  // Combining word and character shares prevents one long foreign term from outweighing several
  // conversational words in the other script, while still handling genuinely dominant mixed text.
  const arabicWordShare = arabicWords.length / words;
  const arabicCharShare = arabicChars / chars;
  const arabicStrength = (arabicWordShare * 0.65) + (arabicCharShare * 0.35);
  if (arabicStrength >= 0.64) return { language: 'ar', explicit: false, words, strength: arabicStrength };
  if (arabicStrength <= 0.36) return { language: 'en', explicit: false, words, strength: 1 - arabicStrength };
  return null;
}

// Returns 'ar' | 'en' | null for one message in isolation.
function detectTextLanguage(text) {
  return languageSignal(text)?.language || null;
}

// The latest meaningful turn is primary. If it is ambiguous, code-only, or merely a short foreign
// phrase, inherit the nearest confident recent user turn. A clear/explicit switch wins immediately.
function detectConversationLanguage(recentUserTexts, fallback = 'ar') {
  const signals = recentUserTexts.map(languageSignal);
  let priorLanguage = null;
  for (let i = signals.length - 2; i >= 0; i--) {
    if (signals[i]) { priorLanguage = signals[i].language; break; }
  }

  const latest = signals[signals.length - 1];
  if (latest) {
    if (!priorLanguage || latest.language === priorLanguage) return latest.language;
    const clearSwitch = latest.explicit || latest.words >= 3;
    return clearSwitch ? latest.language : priorLanguage;
  }

  if (priorLanguage) return priorLanguage;
  return fallback === 'en' ? 'en' : 'ar';
}

export { detectTextLanguage, detectConversationLanguage };
