const OPEN_REASONING = '<reasoning>';
const CLOSE_REASONING = '</reasoning>';
const OPEN_ANSWER = '<answer>';
const CLOSE_ANSWER = '</answer>';

// Routes one model content stream shaped as
//   <reasoning>student-facing explanation</reasoning><answer>final response</answer>
// into the existing reasoning/content NDJSON channels. Tags may be split across arbitrary network
// chunks; their partial bytes are retained until they can be recognized and are never shown to users.
function createVisibleReasoningRouter(onDelta) {
  let phase = 'opening';
  let pending = '';
  let raw = '';
  let thinking = '';
  let content = '';
  let structured = false;

  const emit = (kind, text) => {
    if (!text) return;
    if (kind === 'thinking') thinking += text;
    else content += text;
    onDelta({ kind, text });
  };

  const findTag = (tag) => pending.toLowerCase().indexOf(tag);

  const drain = () => {
    while (true) {
      if (phase === 'opening') {
        const index = findTag(OPEN_REASONING);
        if (index < 0) return;
        pending = pending.slice(index + OPEN_REASONING.length);
        structured = true;
        phase = 'reasoning';
        continue;
      }

      if (phase === 'reasoning') {
        const index = findTag(CLOSE_REASONING);
        if (index >= 0) {
          emit('thinking', pending.slice(0, index));
          pending = pending.slice(index + CLOSE_REASONING.length);
          phase = 'between';
          continue;
        }
        const safeLength = Math.max(0, pending.length - (CLOSE_REASONING.length - 1));
        if (safeLength) {
          emit('thinking', pending.slice(0, safeLength));
          pending = pending.slice(safeLength);
        }
        return;
      }

      if (phase === 'between') {
        const index = findTag(OPEN_ANSWER);
        if (index < 0) return;
        pending = pending.slice(index + OPEN_ANSWER.length);
        phase = 'answer';
        continue;
      }

      if (phase === 'answer') {
        const index = findTag(CLOSE_ANSWER);
        if (index >= 0) {
          emit('content', pending.slice(0, index));
          pending = pending.slice(index + CLOSE_ANSWER.length);
          phase = 'done';
          continue;
        }
        const safeLength = Math.max(0, pending.length - (CLOSE_ANSWER.length - 1));
        if (safeLength) {
          emit('content', pending.slice(0, safeLength));
          pending = pending.slice(safeLength);
        }
        return;
      }

      return;
    }
  };

  return {
    push(text) {
      if (!text || phase === 'done') return;
      raw += text;
      pending += text;
      drain();
    },
    finish() {
      drain();
      if (!structured) {
        // A non-compliant model response is still useful as the final answer. It was held until now,
        // so a malformed English preamble can never flash before the chosen-language response path.
        emit('content', raw);
      } else if (phase === 'reasoning') {
        emit('thinking', pending);
      } else if (phase === 'answer') {
        emit('content', pending);
      }
      pending = '';
      return { content, thinking, structured };
    },
  };
}

export { createVisibleReasoningRouter };
