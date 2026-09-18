const OPEN_REASONING = '<reasoning>';
const CLOSE_REASONING = '</reasoning>';
const OPEN_ANSWER = '<answer>';
const CLOSE_ANSWER = '</answer>';

// Parses the public analysis-summary protocol across arbitrary network chunk boundaries. Analysis
// text streams progressively, while enough trailing bytes are retained to ensure a split closing tag
// can never flash in the UI. Any preamble before the opening tag is also withheld permanently.
export function createVisibleReasoningRouter(onDelta) {
  let phase = 'opening';
  let pending = '';
  let raw = '';
  let thinking = '';
  let content = '';
  let structured = false;
  const emit = (kind, text) => {
    if (!text) return;
    if (kind === 'thinking') thinking += text; else content += text;
    onDelta({ kind, text });
  };
  const find = (tag) => pending.toLowerCase().indexOf(tag);
  const drain = () => {
    while (true) {
      if (phase === 'opening') {
        const index = find(OPEN_REASONING);
        if (index < 0) return;
        pending = pending.slice(index + OPEN_REASONING.length);
        structured = true; phase = 'reasoning'; continue;
      }
      if (phase === 'reasoning') {
        const index = find(CLOSE_REASONING);
        if (index >= 0) {
          emit('thinking', pending.slice(0, index));
          pending = pending.slice(index + CLOSE_REASONING.length);
          phase = 'between'; continue;
        }
        // Keep only the longest possible partial closing tag; everything before it is safe analysis.
        const safeLength = Math.max(0, pending.length - (CLOSE_REASONING.length - 1));
        if (safeLength) { emit('thinking', pending.slice(0, safeLength)); pending = pending.slice(safeLength); }
        return;
      }
      if (phase === 'between') {
        const index = find(OPEN_ANSWER);
        if (index < 0) return;
        pending = pending.slice(index + OPEN_ANSWER.length);
        phase = 'answer'; continue;
      }
      if (phase === 'answer') {
        const index = find(CLOSE_ANSWER);
        if (index >= 0) {
          emit('content', pending.slice(0, index));
          pending = pending.slice(index + CLOSE_ANSWER.length);
          phase = 'done'; continue;
        }
        const safeLength = Math.max(0, pending.length - (CLOSE_ANSWER.length - 1));
        if (safeLength) { emit('content', pending.slice(0, safeLength)); pending = pending.slice(safeLength); }
        return;
      }
      return;
    }
  };
  return {
    push(text) { if (!text || phase === 'done') return; raw += text; pending += text; drain(); },
    finish() {
      drain();
      if (!structured) emit('content', raw);
      else if (phase === 'reasoning') emit('thinking', pending);
      else if (phase === 'answer') emit('content', pending);
      pending = '';
      return { content, thinking, structured };
    },
  };
}
