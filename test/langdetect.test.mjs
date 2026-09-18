import test from 'node:test';
import assert from 'node:assert/strict';
import { detectConversationLanguage, detectTextLanguage } from '../public/langdetect.js';

test('a clearly Arabic message detects as Arabic', () => {
  assert.equal(detectTextLanguage('ما معنى السرعة المتوسطة؟ اشرح لي بمثال بسيط.'), 'ar');
});

test('a clearly English message detects as English', () => {
  assert.equal(detectTextLanguage('What does average speed mean? Explain it with a simple example.'), 'en');
});

test('Arabic prose mentioning a Latin filename or library name still detects as Arabic', () => {
  assert.equal(detectTextLanguage('عندي خطأ في ملف main.py وأستخدم React.js، ممكن تساعدني أفهم السبب؟'), 'ar');
});

test('Arabic prose containing a fenced code block of Latin code still detects as Arabic', () => {
  const text = 'ليه الكود ده مش شغال؟\n```js\nfunction add(a, b) { return a + b; }\n```\nمحتاج أفهم الغلط فين.';
  assert.equal(detectTextLanguage(text), 'ar');
});

test('a bare filename or short technical token alone has no confident signal', () => {
  assert.equal(detectTextLanguage('main.py'), null);
  assert.equal(detectTextLanguage('ok'), null);
  assert.equal(detectTextLanguage(''), null);
  assert.equal(detectTextLanguage('   '), null);
});

test('a genuinely mixed message with no dominant script has no confident signal', () => {
  const lang = detectTextLanguage('hello مرحبا how are you كيف حالك');
  assert.equal(lang, null);
});

test('conversation fallback walks backward through recent messages for a low-signal latest turn', () => {
  const recent = ['اشرح لي معنى التسارع من فضلك', 'main.py'];
  assert.equal(detectConversationLanguage(recent, 'en'), 'ar', 'should inherit the earlier confident Arabic turn, not fall to the default');
});

test('conversation fallback defaults to Arabic when nothing in recent history is confident', () => {
  assert.equal(detectConversationLanguage(['main.py', 'ok', ''], 'ar'), 'ar');
  assert.equal(detectConversationLanguage([], 'ar'), 'ar');
});

test('a clear language switch in the latest message wins immediately over older history', () => {
  const recent = ['اشرح لي معنى التسارع من فضلك', 'Actually can you explain this in English instead?'];
  assert.equal(detectConversationLanguage(recent, 'ar'), 'en');
});
