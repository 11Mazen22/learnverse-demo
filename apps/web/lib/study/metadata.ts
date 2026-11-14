import { parseClozeGroups, stripClozeMarkup } from "./cloze.ts";
import type { MatchingMode } from "./answer-matcher.ts";

export type FlashcardMetadata = {
  version: 1;
  hint?: string;
  mnemonic?: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  matching_mode: MatchingMode;
  accepted_answers?: string[];
  normalize_alef?: boolean;
  source?: {
    lesson_id?: string;
    track_id?: string;
  };
};

export type FlashcardDeckMetadata = {
  version: 1;
  subject_slug?: string;
  is_template?: boolean;
  share_scope?: "private" | "class" | "template";
};

export type ImportedStudyCard = {
  card_type: "term_definition" | "question_answer" | "cloze";
  front: string;
  back: string;
  cloze_text: string | null;
  metadata: FlashcardMetadata;
};

const VALID_MODES = new Set<MatchingMode>(["strict", "normalized", "fuzzy"]);
const VALID_DIFF = new Set<"easy" | "medium" | "hard">(["easy", "medium", "hard"]);

export function parseCardMetadata(raw: unknown): FlashcardMetadata {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const mode = typeof obj.matching_mode === "string" && VALID_MODES.has(obj.matching_mode as MatchingMode)
    ? (obj.matching_mode as MatchingMode)
    : "normalized";
  const diff = typeof obj.difficulty === "string" && VALID_DIFF.has(obj.difficulty as "easy" | "medium" | "hard")
    ? (obj.difficulty as "easy" | "medium" | "hard")
    : undefined;

  const accepted = Array.isArray(obj.accepted_answers)
    ? obj.accepted_answers
        .map((v) => (typeof v === "string" ? v.trim().slice(0, 300) : ""))
        .filter((v) => v.length > 0)
        .slice(0, 12)
    : undefined;

  const src = obj.source && typeof obj.source === "object" && !Array.isArray(obj.source)
    ? (obj.source as Record<string, unknown>)
    : null;

  return {
    version: 1,
    hint: typeof obj.hint === "string" && obj.hint.trim() ? obj.hint.trim().slice(0, 600) : undefined,
    mnemonic: typeof obj.mnemonic === "string" && obj.mnemonic.trim() ? obj.mnemonic.trim().slice(0, 600) : undefined,
    explanation: typeof obj.explanation === "string" && obj.explanation.trim() ? obj.explanation.trim().slice(0, 2000) : undefined,
    difficulty: diff,
    matching_mode: mode,
    normalize_alef: obj.normalize_alef === true ? true : undefined,
    accepted_answers: accepted && accepted.length > 0 ? accepted : undefined,
    source: src && (typeof src.lesson_id === "string" || typeof src.track_id === "string")
      ? {
          lesson_id: typeof src.lesson_id === "string" ? src.lesson_id.slice(0, 120) : undefined,
          track_id: typeof src.track_id === "string" ? src.track_id.slice(0, 120) : undefined,
        }
      : undefined,
  };
}

export function serializeCardMetadata(meta: Partial<FlashcardMetadata>): FlashcardMetadata {
  return parseCardMetadata({ version: 1, ...meta });
}

export function parseDeckMetadata(raw: unknown): FlashcardDeckMetadata {
  const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const scope = obj.share_scope === "class" || obj.share_scope === "template" ? obj.share_scope : "private";
  return {
    version: 1,
    subject_slug: typeof obj.subject_slug === "string" && obj.subject_slug.trim() ? obj.subject_slug.trim().slice(0, 80) : undefined,
    is_template: typeof obj.is_template === "boolean" ? obj.is_template : undefined,
    share_scope: scope,
  };
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

/**
 * Parses Anki TSV, CSV, Markdown (`term :: definition`), or Cloze lines
 * (`{{c1::answer::hint}}`) into validated ImportedStudyCard objects.
 */
export function parseBulkImportCards(rawText: string, maxCards = 150): ImportedStudyCard[] {
  const lines = String(rawText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#separator:") && !line.startsWith("#html:") && !line.startsWith("#tags"));

  const imported: ImportedStudyCard[] = [];
  for (const rawLine of lines) {
    if (imported.length >= maxCards) break;
    const cleanLine = rawLine
      .replace(/^[-*]\s+/, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .trim();
    if (!cleanLine) continue;

    // 1. Cloze card syntax anywhere in the line
    if (parseClozeGroups(cleanLine).hasCloze) {
      const stripped = stripClozeMarkup(cleanLine);
      imported.push({
        card_type: "cloze",
        front: stripped.slice(0, 1900),
        back: stripped.slice(0, 3900),
        cloze_text: cleanLine.slice(0, 3900),
        metadata: serializeCardMetadata({ matching_mode: "normalized" }),
      });
      continue;
    }

    // 2. Anki TSV (tab separated)
    if (cleanLine.includes("\t")) {
      const parts = cleanLine.split("\t").map((p) => p.trim());
      if (parts[0] && parts[1]) {
        imported.push({
          card_type: "question_answer",
          front: parts[0].slice(0, 1900),
          back: parts[1].slice(0, 3900),
          cloze_text: null,
          metadata: serializeCardMetadata({
            hint: parts[2] || undefined,
            matching_mode: "normalized",
          }),
        });
      }
      continue;
    }

    // 3. Markdown double-colon (`Term :: Definition`) or arrow (`Front -> Back`)
    const mdSep = cleanLine.includes("::") ? "::" : cleanLine.includes("->") ? "->" : null;
    if (mdSep) {
      const idx = cleanLine.indexOf(mdSep);
      const rawFront = cleanLine.slice(0, idx).trim();
      const front = rawFront.replace(/^\*\*([\s\S]+)\*\*$/, "$1").replace(/^__([\s\S]+)__$/, "$1").trim();
      const back = cleanLine.slice(idx + mdSep.length).trim();
      if (front && back) {
        imported.push({
          card_type: "term_definition",
          front: front.slice(0, 1900),
          back: back.slice(0, 3900),
          cloze_text: null,
          metadata: serializeCardMetadata({ matching_mode: "normalized" }),
        });
      }
      continue;
    }

    // 4. CSV fallback
    const csvCols = splitCsvLine(cleanLine);
    if (csvCols.length >= 2 && csvCols[0] && csvCols[1]) {
      imported.push({
        card_type: "question_answer",
        front: csvCols[0].slice(0, 1900),
        back: csvCols[1].slice(0, 3900),
        cloze_text: null,
        metadata: serializeCardMetadata({
          hint: csvCols[2] || undefined,
          matching_mode: "normalized",
        }),
      });
    }
  }

  return imported;
}
