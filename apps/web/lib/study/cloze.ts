export type ClozeToken =
  | { kind: "text"; text: string }
  | { kind: "cloze"; groupIndex: number; answer: string; hint?: string };

export type ClozeRenderSegment =
  | { kind: "text"; text: string }
  | { kind: "blank"; groupIndex: number; answer: string; hint?: string }
  | { kind: "revealed-other"; text: string }
  | { kind: "revealed-target"; groupIndex: number; text: string };

export type ClozeParseResult = {
  hasCloze: boolean;
  indices: number[];
  tokens: ClozeToken[];
};

const CLOZE_REGEX = /\{\{c([1-9][0-9]*)::([\s\S]*?)(?:::([\s\S]*?))?\}\}/g;

/**
 * Parses Anki-compatible multi-group cloze deletions (`{{c1::answer}}` and
 * `{{c2::answer::hint}}`). Supports arbitrarily many groups (`c1`, `c2`, `c3`...).
 */
export function parseClozeGroups(text: string): ClozeParseResult {
  const input = String(text ?? "");
  const tokens: ClozeToken[] = [];
  const seenIndices = new Set<number>();

  let lastIndex = 0;
  CLOZE_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = CLOZE_REGEX.exec(input)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ kind: "text", text: input.slice(lastIndex, match.index) });
    }
    const groupIndex = Number.parseInt(match[1], 10);
    const answer = match[2].trim();
    const rawHint = match[3]?.trim();
    const hint = rawHint && rawHint.length > 0 ? rawHint : undefined;

    if (answer.length > 0) {
      seenIndices.add(groupIndex);
      tokens.push({ kind: "cloze", groupIndex, answer, hint });
    } else {
      tokens.push({ kind: "text", text: match[0] });
    }
    lastIndex = CLOZE_REGEX.lastIndex;
  }

  if (lastIndex < input.length) {
    tokens.push({ kind: "text", text: input.slice(lastIndex) });
  }

  const indices = [...seenIndices].sort((a, b) => a - b);
  return {
    hasCloze: indices.length > 0,
    indices,
    tokens,
  };
}

/**
 * Renders structured segments for a specific cloze target group `targetIndex`.
 * Other cloze groups are displayed as inline text so the learner focuses strictly
 * on recalling group `targetIndex`.
 */
export function renderClozeSegments(
  text: string,
  targetIndex: number,
  revealTarget = false,
): ClozeRenderSegment[] {
  const { tokens } = parseClozeGroups(text);
  return tokens.map((token) => {
    if (token.kind === "text") {
      return { kind: "text", text: token.text };
    }
    if (token.groupIndex !== targetIndex) {
      return { kind: "revealed-other", text: token.answer };
    }
    if (revealTarget) {
      return { kind: "revealed-target", groupIndex: token.groupIndex, text: token.answer };
    }
    return {
      kind: "blank",
      groupIndex: token.groupIndex,
      answer: token.answer,
      hint: token.hint,
    };
  });
}

export function getClozeAnswers(
  text: string,
  targetIndex: number,
): Array<{ answer: string; hint?: string }> {
  const { tokens } = parseClozeGroups(text);
  return tokens
    .filter((token): token is Extract<ClozeToken, { kind: "cloze" }> =>
      token.kind === "cloze" && token.groupIndex === targetIndex,
    )
    .map((token) => ({ answer: token.answer, hint: token.hint }));
}

export function formatClozePlainPrompt(text: string, targetIndex: number, revealTarget = false): string {
  return renderClozeSegments(text, targetIndex, revealTarget)
    .map((seg) => {
      if (seg.kind === "blank") return seg.hint ? `[${seg.hint}]` : "[…]";
      return seg.text;
    })
    .join("");
}

export function stripClozeMarkup(text: string): string {
  return parseClozeGroups(text)
    .tokens.map((t) => (t.kind === "text" ? t.text : t.answer))
    .join("");
}
