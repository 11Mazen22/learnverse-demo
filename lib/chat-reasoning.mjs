const OPEN_REASONING = '<reasoning>';
const CLOSE_REASONING = '</reasoning>';
const OPEN_ANSWER = '<answer>';
const CLOSE_ANSWER = '</answer>';

// Parses the public analysis-summary protocol across arbitrary network chunk boundaries. The full
// summary is held until its closing tag, so malformed tags or a leaked preamble never flash in UI.
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
        if (index < 0) return;
        emit('thinking', pending.slice(0, index).trim());
        pending = pending.slice(index + CLOSE_REASONING.length);
        phase = 'between'; continue;
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
      else if (phase === 'reasoning') emit('thinking', pending.trim());
      else if (phase === 'answer') emit('content', pending);
      pending = '';
      return { content, thinking, structured };
    },
  };
}
