const RECOVERABLE = new Set(['stopped', 'failed']);

export function canContinueMessage(message) {
  return Boolean(message && message.role === 'assistant' && RECOVERABLE.has(message.status) && message.content);
}

export function continuationInstruction(language, partial) {
  const tail = String(partial || '').slice(-2400);
  const markdownState = describeOpenMarkdown(tail);
  if (language === 'en') {
    return [
      'Continue the immediately preceding assistant response from the exact point where it stopped.',
      'Output only the missing continuation. Do not repeat, summarize, restart, or quote any existing text.',
      `Markdown state at the interruption: ${markdownState}. Close any unfinished structure naturally.`,
    ].join('\n');
  }
  return [
    'أكمل رد المساعد السابق مباشرة من النقطة التي توقف عندها.',
    'أخرج الجزء الناقص فقط، ولا تكرر أو تلخص أو تعيد بداية أي نص موجود.',
    `حالة Markdown عند التوقف: ${markdownState}. أكمل أي بنية غير مكتملة وأغلقها بصورة طبيعية.`,
  ].join('\n');
}

export function describeOpenMarkdown(text) {
  const fences = String(text).match(/^\s*(```+|~~~+)/gm) || [];
  if (fences.length % 2) return 'an open fenced block';
  const lines = String(text).split('\n');
  const last = lines.at(-1) || '';
  if (/^\s*[-*+]\s+/.test(last)) return 'an unfinished unordered list';
  if (/^\s*\d+[.)]\s+/.test(last)) return 'an unfinished ordered list';
  if (/^\s*\|/.test(last)) return 'an unfinished table row';
  if (/^\s*(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)/i.test(lines.find((line) => line.trim()) || '')) return 'an unfinished Mermaid diagram';
  return 'ordinary prose';
}

// Models sometimes repeat the last sentence despite an explicit continuation instruction. Merge at
// the largest exact suffix/prefix boundary so persisted output remains one coherent response.
export function mergeContinuation(existing, extension) {
  const left = String(existing || '');
  const right = String(extension || '');
  const max = Math.min(left.length, right.length, 4000);
  let overlap = 0;
  for (let size = max; size >= 12; size -= 1) {
    if (left.slice(-size) === right.slice(0, size)) { overlap = size; break; }
  }
  return left + right.slice(overlap);
}

export function transitionResponseState(current, event) {
  const table = {
    idle: { start: 'generating' },
    generating: { stop: 'stopped', complete: 'completed', fail: 'failed' },
    stopped: { continue: 'continuing', supersede: 'completed' },
    continuing: { stop: 'stopped', complete: 'completed', fail: 'failed' },
    failed: { continue: 'continuing', supersede: 'completed' },
    completed: {},
  };
  return table[current]?.[event] || current;
}
