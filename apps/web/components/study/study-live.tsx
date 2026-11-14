"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { confirmAction } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/supabase/database.types";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import {
  type QuizDifficulty,
  type QuizFlashcard,
  type QuizGeckoBundle,
  exportToAnkiTSV,
  generateQuizGeckoBundle,
} from "@/lib/study/quizgecko-engine";
import {
  type FlashcardMetadata,
  type ImportedStudyCard,
  parseCardMetadata,
  serializeCardMetadata,
} from "@/lib/study/metadata";
import type { MatchingMode } from "@/lib/study/answer-matcher";
import { stripClozeMarkup } from "@/lib/study/cloze";
import type { RecallRating } from "@/lib/study/scheduler";
import { StudyRichText } from "./study-rich-text";
import {
  FlashcardReviewStudio,
  type StudioCardItem,
} from "./flashcard-review-studio";
import {
  InteractiveQuizRunner,
  type QuizMistakeRecord,
} from "./interactive-quiz-runner";
import { StudySpeedMatch } from "./study-speed-match";
import { StudyImportExport } from "./study-import-export";
import {
  type DeckSummary,
  type MistakeLogItem,
  type StudySessionItem,
  StudyMistakeHub,
} from "./study-mistake-hub";

type StudyTask = {
  id: string;
  title: string;
  notes: string;
  task_type: string;
  priority: string;
  status: string;
  due_at: string | null;
  completed_at: string | null;
  recommendation_reason: string | null;
};

type Deck = {
  id: string;
  title: string;
  description: string;
  status: string;
  source_type: string;
  source_version: string | null;
  lesson_id: string | null;
  updated_at: string;
};

type Card = {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  card_type: string;
  cloze_text: string | null;
  position: number;
  state: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  suspended: boolean;
  metadata: FlashcardMetadata;
};

type ReviewReceipt = {
  card_id?: string;
  due_at?: string;
  interval_days?: number;
  duplicate?: boolean;
};

type StudyTab = "generator" | "quiz" | "review" | "decks" | "tasks";
type ReviewMode = "spaced" | "cram" | "speed_match" | "mistake_hub";

function makePreviewSeed(isEn: boolean): {
  decks: Deck[];
  cards: Card[];
  tasks: StudyTask[];
  mistakes: MistakeLogItem[];
} {
  const nowIso = new Date().toISOString();
  const deckA = "preview-deck-stem";
  const deckB = "preview-deck-lang";

  const decks: Deck[] = [
    {
      id: deckA,
      title: isEn ? "Physics & Calculus Studio" : "مختبر الفيزياء والتفاضل",
      description: isEn
        ? "Active recall, multi-group cloze, and KaTeX formulas."
        : "استرجاع نشط مع بطاقات الحذف المتعدد ومعادلات الرياضيات.",
      status: "active",
      source_type: "manual",
      source_version: null,
      lesson_id: null,
      updated_at: nowIso,
    },
    {
      id: deckB,
      title: isEn ? "Arabic Precision & Grammar" : "دقة اللغة العربية والنحو",
      description: isEn
        ? "Strict distinguishing between Ta Marbuta (ة) and Ha (ه)."
        : "تدريب التمييز الدقيق بين التاء المربوطة والهاء.",
      status: "active",
      source_type: "manual",
      source_version: null,
      lesson_id: null,
      updated_at: nowIso,
    },
  ];

  const cards: Card[] = [
    {
      id: "preview-card-1",
      deck_id: deckA,
      front: isEn
        ? "Compute the definite integral $\\int_0^1 3x^2\\,dx$."
        : "احسب قيمة التكامل المحدد $\\int_0^1 3x^2\\,dx$.",
      back: "1",
      card_type: "question_answer",
      cloze_text: null,
      position: 1,
      state: "learning",
      interval_days: 1,
      ease_factor: 2.5,
      repetitions: 1,
      lapses: 0,
      due_at: nowIso,
      suspended: false,
      metadata: serializeCardMetadata({
        hint: isEn ? "Antiderivative is x^3" : "الدالة الأصلية هي $x^3$",
        explanation: isEn
          ? "Evaluate x^3 at upper bound 1 minus lower bound 0: $1^3 - 0^3 = 1$."
          : "بالتعويض بحدّي التكامل: $1^3 - 0^3 = 1$.",
        matching_mode: "normalized",
      }),
    },
    {
      id: "preview-card-2",
      deck_id: deckA,
      front: isEn
        ? "Photosynthesis converts carbon dioxide into glucose inside chloroplasts."
        : "يحول البناء الضوئي ثاني أكسيد الكربون إلى جلوكوز داخل البلاستيدات الخضراء.",
      back: isEn ? "carbon dioxide / glucose" : "ثاني أكسيد الكربون / جلوكوز",
      card_type: "cloze",
      cloze_text: isEn
        ? "Photosynthesis converts {{c1::carbon dioxide::gas}} into {{c2::glucose::sugar}} inside chloroplasts."
        : "يحول البناء الضوئي {{c1::ثاني أكسيد الكربون::الغاز الممتص}} إلى {{c2::جلوكوز::السكر الناتج}} داخل البلاستيدات الخضراء.",
      position: 2,
      state: "new",
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      lapses: 1,
      due_at: nowIso,
      suspended: false,
      metadata: serializeCardMetadata({
        hint: isEn ? "Two-step reaction cycle" : "مرحلتا التفاعل الضوئي واللاضوئي",
        matching_mode: "normalized",
      }),
    },
    {
      id: "preview-card-3",
      deck_id: deckA,
      front: isEn ? "Newton's Second Law of Motion" : "قانون نيوتن الثاني للحركة",
      back: "$F = m \\cdot a$",
      card_type: "term_definition",
      cloze_text: null,
      position: 3,
      state: "review",
      interval_days: 6,
      ease_factor: 2.5,
      repetitions: 2,
      lapses: 0,
      due_at: nowIso,
      suspended: false,
      metadata: serializeCardMetadata({
        accepted_answers: ["F = ma", "F=ma"],
        matching_mode: "fuzzy",
      }),
    },
    {
      id: "preview-card-4",
      deck_id: deckB,
      front: isEn
        ? "Arabic word for 'school' ending in Ta Marbuta"
        : "اكتب الكلمة الصحيحة المنتهية بتاء مربوطة: مكان التعلّم",
      back: "مدرسة",
      card_type: "question_answer",
      cloze_text: null,
      position: 4,
      state: "new",
      interval_days: 0,
      ease_factor: 2.5,
      repetitions: 0,
      lapses: 1,
      due_at: nowIso,
      suspended: false,
      metadata: serializeCardMetadata({
        hint: isEn ? "Check the final letter ة vs ه" : "تأكد من نقطتي التاء المربوطة (ة)",
        matching_mode: "normalized",
      }),
    },
  ];

  const tasks: StudyTask[] = [
    {
      id: "preview-task-1",
      title: isEn
        ? "Complete 10-card Cloze & Typed Recall sprint"
        : "إتمام جولة ١٠ بطاقات بين الحذف والكتابة النشطة",
      notes: "",
      task_type: "study",
      priority: "high",
      status: "open",
      due_at: null,
      completed_at: null,
      recommendation_reason: isEn ? "High retention impact" : "أعلى أثر على التثبيت",
    },
  ];

  const mistakes: MistakeLogItem[] = [
    {
      id: "preview-mistake-1",
      source_type: "typed_recall",
      deck_id: deckB,
      card_id: "preview-card-4",
      lesson_id: null,
      topic: isEn ? "Arabic Spelling" : "الإملاء الدقيق",
      prompt: isEn
        ? "Arabic word for 'school' ending in Ta Marbuta"
        : "اكتب الكلمة الصحيحة المنتهية بتاء مربوطة: مكان التعلّم",
      user_answer: "مدرسه",
      expected_answer: "مدرسة",
      explanation: isEn
        ? "Ta Marbuta (ة) cannot be substituted with bare Ha (ه)."
        : "لا يصح إبدال التاء المربوطة (ة) بالهاء (ه) في الكتابة الدقيقة.",
      mistake_count: 1,
      resolved_at: null,
      last_missed_at: nowIso,
    },
  ];

  return { decks, cards, tasks, mistakes };
}

function mapCardToStudioItem(card: Card): StudioCardItem {
  return {
    id: card.id,
    front: card.front,
    back: card.back,
    cardType: card.card_type,
    clozeText: card.cloze_text,
    hint: card.metadata.hint,
    mnemonic: card.metadata.mnemonic,
    explanation: card.metadata.explanation,
    state: card.state,
    intervalDays: card.interval_days,
    easeFactor: card.ease_factor,
    repetitions: card.repetitions,
    lapses: card.lapses,
    suspended: card.suspended,
    metadata: card.metadata,
  };
}

export function StudyLive() {
  const t = useTranslation();
  const locale = useLocale();
  const isEn = locale === "en";
  const { push: rawPush } = useToast();
  const push = useCallback(
    (title: string, tone: "info" | "success" | "warning" | "danger" | "error" = "info") => {
      rawPush({ title, tone: tone === "error" ? "danger" : tone });
    },
    [rawPush],
  );
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();

  const canSyncAccount = Boolean(account.user && !account.error);
  const userId = account.user?.id ?? null;

  // Main Views
  const [view, setView] = useState<StudyTab>("generator");
  const [reviewMode, setReviewMode] = useState<ReviewMode>("spaced");

  // Database + Preview Data
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [mistakes, setMistakes] = useState<MistakeLogItem[]>([]);
  const [sessions, setSessions] = useState<StudySessionItem[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [customStudioCards, setCustomStudioCards] = useState<{
    title: string;
    cards: StudioCardItem[];
    mode: "spaced" | "cram";
  } | null>(null);

  // Loading & Mutation Status
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reviewKeys = useRef(new Map<string, string>());
  const previewSeeded = useRef(false);

  // Generator State
  const [genSource, setGenSource] = useState<"topic" | "lesson" | "text">("topic");
  const [genTopic, setGenTopic] = useState("");
  const [genText, setGenText] = useState("");
  const [genDifficulty, setGenDifficulty] = useState<QuizDifficulty>("medium");
  const [genQuestionCount, setGenQuestionCount] = useState(5);
  const [genCardCount, setGenCardCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [activeBundle, setActiveBundle] = useState<QuizGeckoBundle | null>(null);

  // URL Lesson context
  const [linkedLesson, setLinkedLesson] = useState<{
    id: string;
    title: string;
    summary?: string;
  } | null>(null);

  // Tasks Composer State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");

  // Deck & Rich Card Composer State
  const [deckTitle, setDeckTitle] = useState("");
  const [cardType, setCardType] = useState<"term_definition" | "question_answer" | "cloze">("term_definition");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [clozeText, setClozeText] = useState("");
  const [cardHint, setCardHint] = useState("");
  const [cardMnemonic, setCardMnemonic] = useState("");
  const [cardExplanation, setCardExplanation] = useState("");
  const [matchingMode, setMatchingMode] = useState<MatchingMode>("normalized");
  const [normalizeAlef, setNormalizeAlef] = useState(false);
  const [acceptedAnswersText, setAcceptedAnswersText] = useState("");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editHint, setEditHint] = useState("");
  const [editCloze, setEditCloze] = useState("");
  const [deckSearch, setDeckSearch] = useState("");

  // Load workspace (authenticated Supabase OR Local Study Preview)
  const load = useCallback(async () => {
    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      if (!previewSeeded.current) {
        const seed = makePreviewSeed(isEn);
        setDecks(seed.decks);
        setCards(seed.cards);
        setTasks(seed.tasks);
        setMistakes(seed.mistakes);
        setSessions([]);
        setSelectedDeck((cur) => cur ?? seed.decks[0]?.id ?? null);
        previewSeeded.current = true;
      }
      setLoading(false);
      return;
    }

    previewSeeded.current = false;
    const revision = account.revision.current;
    setLoading(true);
    setError("");

    const [taskRes, deckRes, cardRes, mistakeRes, sessionRes] = await Promise.all([
      supabase
        .from("study_tasks")
        .select("id,title,notes,task_type,priority,status,due_at,completed_at,recommendation_reason")
        .eq("user_id", currentUser.id)
        .order("status")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(200),
      supabase
        .from("flashcard_decks")
        .select("id,title,description,status,source_type,source_version,lesson_id,updated_at")
        .eq("user_id", currentUser.id)
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("flashcards")
        .select(
          "id,deck_id,front,back,card_type,cloze_text,position,state,interval_days,ease_factor,repetitions,lapses,due_at,suspended,metadata",
        )
        .eq("user_id", currentUser.id)
        .order("position")
        .limit(1000),
      supabase
        .from("study_mistake_logs")
        .select(
          "id,source_type,deck_id,card_id,lesson_id,topic,prompt,user_answer,expected_answer,explanation,mistake_count,resolved_at,last_missed_at",
        )
        .eq("user_id", currentUser.id)
        .order("last_missed_at", { ascending: false })
        .limit(200),
      supabase
        .from("study_sessions")
        .select(
          "id,session_mode,title,deck_ids,status,total_items,completed_items,correct_items,started_at,updated_at",
        )
        .eq("user_id", currentUser.id)
        .order("updated_at", { ascending: false })
        .limit(30),
    ]);

    if (revision !== account.revision.current) return;

    if (taskRes.error || deckRes.error || cardRes.error) {
      setError(
        t(
          "تعذر تحميل بيانات المذاكرة من الحساب.",
          "Could not load account study data right now.",
        ),
      );
    } else {
      setTasks((taskRes.data ?? []) as StudyTask[]);
      setDecks((deckRes.data ?? []) as Deck[]);
      const parsedCards = (cardRes.data ?? []).map((row) => ({
        id: row.id,
        deck_id: row.deck_id,
        front: row.front,
        back: row.back,
        card_type: row.card_type,
        cloze_text: row.cloze_text,
        position: row.position,
        state: row.state,
        interval_days: row.interval_days,
        ease_factor: Number(row.ease_factor),
        repetitions: row.repetitions,
        lapses: row.lapses,
        due_at: row.due_at,
        suspended: row.suspended,
        metadata: parseCardMetadata(row.metadata),
      }));
      setCards(parsedCards);
      setMistakes(((mistakeRes.data ?? []) as unknown) as MistakeLogItem[]);
      setSessions(((sessionRes.data ?? []) as unknown) as StudySessionItem[]);
      setSelectedDeck((current) =>
        current && (deckRes.data ?? []).some((d) => d.id === current)
          ? current
          : deckRes.data?.[0]?.id ?? null,
      );
    }
    setLoading(false);
  }, [account.revision, account.user, canSyncAccount, isEn, supabase, t]);

  // URL Query Params + Initial Load
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const lessonId = parameters.get("lesson");
    const title = parameters.get("title")?.trim();
    const topicParam = parameters.get("topic")?.trim();
    const tab = parameters.get("tab") ?? parameters.get("view");

    if (tab && ["generator", "quiz", "review", "decks", "tasks"].includes(tab)) {
      setView(tab as StudyTab);
    }

    if (lessonId && title) {
      setLinkedLesson({ id: lessonId, title });
      setGenSource("lesson");
      setGenTopic(title);
      setTaskTitle((current) => current || t(`مذاكرة: ${title}`, `Study: ${title}`));
      setDeckTitle((current) => current || title.slice(0, 160));
    } else if (topicParam) {
      setGenTopic(topicParam);
    }

    reviewKeys.current.clear();
    if (!account.loading) void load();
  }, [account.loading, load, t]);

  // Derived collections
  const openTasks = useMemo(() => tasks.filter((task) => task.status === "open"), [tasks]);
  const activeDeckIds = useMemo(
    () => new Set(decks.filter((deck) => deck.status === "active").map((deck) => deck.id)),
    [decks],
  );

  const dueCards = useMemo(
    () =>
      cards
        .filter(
          (card) =>
            activeDeckIds.has(card.deck_id) &&
            !card.suspended &&
            Number.isFinite(Date.parse(card.due_at)) &&
            Date.parse(card.due_at) <= Date.now(),
        )
        .sort((left, right) => Date.parse(left.due_at) - Date.parse(right.due_at)),
    [activeDeckIds, cards],
  );

  const selectedDeckObj = useMemo(
    () => decks.find((d) => d.id === selectedDeck) ?? null,
    [decks, selectedDeck],
  );

  const selectedCards = useMemo(() => {
    const list = cards.filter((c) => c.deck_id === selectedDeck);
    const q = deckSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.cloze_text ?? "").toLowerCase().includes(q),
    );
  }, [cards, deckSearch, selectedDeck]);

  const deckSummaries: DeckSummary[] = useMemo(() => {
    const now = Date.now();
    return decks.map((deck) => {
      const deckCards = cards.filter((c) => c.deck_id === deck.id && !c.suspended);
      const dueCount = deckCards.filter(
        (c) => Number.isFinite(Date.parse(c.due_at)) && Date.parse(c.due_at) <= now,
      ).length;
      const lapseCount = deckCards.filter((c) => c.lapses > 0 || c.state === "relearning").length;
      return {
        id: deck.id,
        title: deck.title,
        cardCount: deckCards.length,
        dueCount,
        lapseCount,
      };
    });
  }, [cards, decks]);

  // Helper: record study session cleanly
  const recordStudySession = useCallback(
    async (payload: {
      mode:
        | "spaced"
        | "cram"
        | "cloze"
        | "typed_recall"
        | "practice_quiz"
        | "exam_sim"
        | "speed_match"
        | "adaptive"
        | "mistake_drill"
        | "interleaved";
      title: string;
      deckIds: string[];
      totalItems: number;
      completedItems: number;
      correctItems: number;
      completed: boolean;
    }) => {
      const currentUser = account.user;
      if (!canSyncAccount || !currentUser) return;
      const safeTotal = Math.max(0, Math.min(500, payload.totalItems));
      const safeCompleted = Math.max(0, Math.min(safeTotal, payload.completedItems));
      const safeCorrect = Math.max(0, Math.min(safeCompleted, payload.correctItems));

      await supabase.from("study_sessions").insert({
        user_id: currentUser.id,
        session_mode: payload.mode,
        title: payload.title.slice(0, 180),
        deck_ids: payload.deckIds,
        status: payload.completed ? "completed" : "in_progress",
        total_items: safeTotal,
        completed_items: safeCompleted,
        correct_items: safeCorrect,
        completed_at: payload.completed ? new Date().toISOString() : null,
      });
    },
    [account.user, canSyncAccount, supabase],
  );

  // Helper: log mistake (works in both Account DB & Local Preview)
  const handleLogMistake = useCallback(
    async (entry: {
      cardId?: string | null;
      deckId?: string | null;
      sourceType: "quiz" | "cloze" | "typed_recall" | "flashcard" | "exam";
      topic: string;
      prompt: string;
      userAnswer: string;
      expectedAnswer: string;
      explanation: string;
    }) => {
      const prompt = entry.prompt.trim().slice(0, 1900);
      const expected = entry.expectedAnswer.trim().slice(0, 1900);
      if (!prompt || !expected) return;

      const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
        const now = new Date().toISOString();
        setMistakes((prev) => {
          const existing = prev.find(
            (m) => m.prompt === prompt && m.expected_answer === expected && !m.resolved_at,
          );
          if (existing) {
            return prev.map((m) =>
              m.id === existing.id
                ? { ...m, mistake_count: m.mistake_count + 1, user_answer: entry.userAnswer, last_missed_at: now }
                : m,
            );
          }
          return [
            {
              id: `local-mistake-${crypto.randomUUID()}`,
              source_type: entry.sourceType,
              deck_id: entry.deckId ?? null,
              card_id: entry.cardId ?? null,
              lesson_id: linkedLesson?.id ?? null,
              topic: entry.topic.trim().slice(0, 180) || t("مذاكرة نشطة", "Active Study"),
              prompt,
              user_answer: entry.userAnswer.slice(0, 950),
              expected_answer: expected,
              explanation: entry.explanation.slice(0, 3900),
              mistake_count: 1,
              resolved_at: null,
              last_missed_at: now,
            },
            ...prev,
          ];
        });
        return;
      }

      const validDeckId =
        entry.deckId && !entry.deckId.startsWith("preview-") ? entry.deckId : null;
      const validCardId =
        entry.cardId && !entry.cardId.startsWith("preview-") && !entry.cardId.startsWith("mistake-")
          ? entry.cardId
          : null;

      await supabase.from("study_mistake_logs").insert({
        user_id: currentUser.id,
        source_type: entry.sourceType,
        deck_id: validDeckId,
        card_id: validCardId,
        lesson_id: linkedLesson?.id ?? null,
        topic: entry.topic.trim().slice(0, 180) || t("مذاكرة", "Study"),
        prompt,
        user_answer: entry.userAnswer.slice(0, 950),
        expected_answer: expected,
        explanation: entry.explanation.slice(0, 3900),
      });
    },
    [account.user, canSyncAccount, linkedLesson?.id, supabase, t],
  );

  // 1. Smart Study Bundle Generator
  async function handleGenerateBundle() {
    setGenerating(true);
    setError("");
    try {
      const bundle = await generateQuizGeckoBundle({
        topic: genTopic.trim(),
        text: genSource === "text" ? genText.trim() : undefined,
        lessonId: linkedLesson?.id,
        lessonTitle: linkedLesson?.title,
        difficulty: genDifficulty,
        locale: locale as "ar" | "en",
        questionCount: genQuestionCount,
        cardCount: genCardCount,
        supabaseClient: canSyncAccount ? supabase : undefined,
      });

      setActiveBundle(bundle);
      if (bundle.aiError) {
        setError(bundle.aiError.userMessage);
        push(bundle.aiError.userMessage, "warning");
      } else {
        push(
          t(
            `تم توليد الحزمة بنجاح: ${bundle.questions.length} أسئلة و${bundle.cards.length} بطاقات.`,
            `Smart bundle ready: ${bundle.questions.length} questions and ${bundle.cards.length} flashcards.`,
          ),
          "success",
        );
      }
    } catch {
      setError(t("تعذّر توليد الحزمة الذكية. حاول مجدداً.", "Could not generate study bundle. Please try again."));
    } finally {
      setGenerating(false);
    }
  }

  // 2. Save Generated Cards (or Remedial Cards) to Deck
  async function saveCardsToNewDeck(
    title: string,
    description: string,
    bundleCards: QuizFlashcard[],
    sourceType: "ai_draft" | "manual" = "ai_draft",
  ) {
    const cleanTitle = title.trim().slice(0, 160) || t("مجموعة مذاكرة ذكية", "Smart Study Deck");

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      const newDeckId = `preview-deck-${crypto.randomUUID()}`;
      const nowIso = new Date().toISOString();
      const newDeck: Deck = {
        id: newDeckId,
        title: cleanTitle,
        description: description.slice(0, 400),
        status: "active",
        source_type: sourceType,
        source_version: null,
        lesson_id: linkedLesson?.id ?? null,
        updated_at: nowIso,
      };
      const newCards: Card[] = bundleCards.map((c, idx) => ({
        id: `preview-card-${crypto.randomUUID()}`,
        deck_id: newDeckId,
        front: c.front,
        back: c.back,
        card_type: "question_answer",
        cloze_text: null,
        position: idx + 1,
        state: "new",
        interval_days: 0,
        ease_factor: 2.5,
        repetitions: 0,
        lapses: 0,
        due_at: nowIso,
        suspended: false,
        metadata: serializeCardMetadata({
          hint: c.hint || undefined,
          mnemonic: c.mnemonic || undefined,
          matching_mode: "normalized",
        }),
      }));
      setDecks((prev) => [newDeck, ...prev]);
      setCards((prev) => [...newCards, ...prev]);
      setSelectedDeck(newDeckId);
      setView("decks");
      push(t("حُفظت المجموعة في المعاينة المحلية!", "Deck saved in local preview!"), "success");
      return;
    }

    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const deckRes = await supabase
        .from("flashcard_decks")
        .insert({
          user_id: currentUser.id,
          title: cleanTitle,
          description: description.slice(0, 500),
          status: "active",
          source_type: sourceType,
          lesson_id: linkedLesson?.id ?? null,
        })
        .select("id")
        .single();

      if (deckRes.error || !deckRes.data) {
        throw new Error(deckRes.error?.message || "Failed to create deck");
      }

      const newDeckId = deckRes.data.id;
      const cardsInsert = bundleCards.map((c, i) => ({
        deck_id: newDeckId,
        user_id: currentUser.id,
        card_type: "question_answer",
        front: c.front,
        back: c.back,
        cloze_text: null,
        position: i + 1,
        metadata: serializeCardMetadata({
          hint: c.hint || undefined,
          mnemonic: c.mnemonic || undefined,
          matching_mode: "normalized",
        }) as unknown as Json,
      }));

      const cardsRes = await supabase.from("flashcards").insert(cardsInsert);
      if (cardsRes.error) throw cardsRes.error;

      setSelectedDeck(newDeckId);
      await load();
      setView("decks");
      push(t("تم حفظ الحزمة في حسابك بنجاح!", "Study deck saved to your account!"), "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(t("تعذّر حفظ البطاقات في الحساب. ", "Could not save cards to account. ") + msg);
    } finally {
      setBusy(false);
    }
  }

  function handleExportAnki(bundleCards: QuizFlashcard[]) {
    const tsv = exportToAnkiTSV(bundleCards);
    const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noata-deck-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    push(t("تم تصدير ملف Anki بنجاح.", "Anki deck file downloaded."), "success");
  }

  // 3. Atomic SM-2 Card Review (returns strict boolean so studio never loses place on RPC error)
  const reviewCard = useCallback(
    async (cardId: string, rating: RecallRating): Promise<boolean> => {
      // Local preview mode: compute realistic immediate visual feedback cleanly in browser memory
      const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
        setCards((prev) =>
          prev.map((c) => {
            if (c.id !== cardId) return c;
            const days = rating === 0 ? 0 : rating === 1 ? 1 : rating === 2 ? Math.max(1, c.interval_days * 2) : Math.max(4, c.interval_days * 3);
            const nextDue = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            return {
              ...c,
              interval_days: days,
              lapses: rating === 0 ? c.lapses + 1 : c.lapses,
              repetitions: rating === 0 ? 0 : c.repetitions + 1,
              state: rating === 0 ? "relearning" : "review",
              due_at: nextDue,
            };
          }),
        );
        return true;
      }

      if (busy) return false;
      setBusy(true);
      setError("");

      try {
        const fingerprint = `${cardId}:${rating}`;
        if (!reviewKeys.current.has(fingerprint)) {
          reviewKeys.current.set(fingerprint, crypto.randomUUID());
        }

        const result = await supabase.rpc("review_flashcard", {
          p_card_id: cardId,
          p_rating: rating,
          p_idempotency_key: reviewKeys.current.get(fingerprint)!,
        });

        if (result.error) {
          push(
            t(
              "لم يتأكد حفظ المراجعة. أعد نفس التقييم للتحقق دون تكراره.",
              "Review was not confirmed by server. Retry safely without duplicating.",
            ),
            "error",
          );
          return false;
        }

        const receipt = (result.data ?? {}) as ReviewReceipt;
        if (receipt.card_id === cardId && receipt.due_at) {
          reviewKeys.current.delete(fingerprint);
          setCards((prev) =>
            prev.map((c) =>
              c.id === cardId
                ? {
                    ...c,
                    due_at: receipt.due_at!,
                    interval_days: receipt.interval_days ?? c.interval_days,
                    state: rating === 0 ? "relearning" : "review",
                  }
                : c,
            ),
          );
          return true;
        }

        return false;
      } finally {
        setBusy(false);
      }
    },
    [account.user, busy, canSyncAccount, push, supabase, t],
  );

  // 4. Suspend / Unsuspend card
  const handleSuspendCard = useCallback(
    async (cardId: string, suspended: boolean) => {
      const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
        setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, suspended } : c)));
        push(suspended ? t("تم تعليق البطاقة مؤقتاً.", "Card suspended.") : t("أُعيد تفعيل البطاقة.", "Card unsuspended."), "info");
        return true;
      }
      setBusy(true);
      const res = await supabase
        .from("flashcards")
        .update({ suspended })
        .eq("id", cardId)
        .select("id")
        .single();
      setBusy(false);
      if (res.error) {
        push(t("تعذّر تحديث حالة البطاقة.", "Failed to update card status."), "error");
        return false;
      }
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, suspended } : c)));
      push(suspended ? t("تم تعليق البطاقة مؤقتاً.", "Card suspended.") : t("أُعيد تفعيل البطاقة.", "Card unsuspended."), "info");
      return true;
    },
    [account.user, canSyncAccount, push, supabase, t],
  );

  // 5. Tasks handlers
  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const dueAt = taskDue ? new Date(taskDue) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      setError(t("موعد المهمة غير صالح.", "Task due date is invalid."));
      return;
    }

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      setTasks((prev) => [
        {
          id: `preview-task-${crypto.randomUUID()}`,
          title: taskTitle.trim(),
          notes: "",
          task_type: linkedLesson ? "lesson" : "study",
          priority: taskPriority,
          status: "open",
          due_at: dueAt?.toISOString() ?? null,
          completed_at: null,
          recommendation_reason: null,
        },
        ...prev,
      ]);
      setTaskTitle("");
      setTaskDue("");
      setTaskPriority("normal");
      push(t("تمت إضافة المهمة إلى المعاينة المحلية.", "Task added to local preview."), "success");
      return;
    }

    if (busy) return;
    setBusy(true);
    setError("");
    const result = await supabase
      .from("study_tasks")
      .insert({
        user_id: currentUser.id,
        title: taskTitle.trim(),
        due_at: dueAt?.toISOString() ?? null,
        priority: taskPriority,
        source: "personal",
        task_type: linkedLesson ? "lesson" : "study",
        lesson_id: linkedLesson?.id ?? null,
      })
      .select("id")
      .single();

    if (result.error) setError(t("تعذّر حفظ المهمة.", "Could not save task."));
    else {
      setTaskTitle("");
      setTaskDue("");
      setTaskPriority("normal");
      push(t("تم حفظ المهمة في خطتك.", "Study task saved."), "success");
      await load();
    }
    setBusy(false);
  }

  async function setTaskState(task: StudyTask, completed: boolean) {
    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? { ...item, status: completed ? "completed" : "open", completed_at: completed ? new Date().toISOString() : null }
            : item,
        ),
      );
      return;
    }
    if (busy) return;
    setBusy(true);
    const result = await supabase
      .from("study_tasks")
      .update({
        status: completed ? "completed" : "open",
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", task.id)
      .select("id")
      .single();
    if (result.error) push(t("تعذّر تحديث المهمة.", "Could not update task."), "error");
    else await load();
    setBusy(false);
  }

  async function removeTask(task: StudyTask) {
    const ok = await confirmAction({
      title: t("حذف مهمة المذاكرة؟", "Delete study task?"),
      description: t(`سيتم حذف: «${task.title}» من قائمة مهامك.`, `Remove "${task.title}" from your planner.`),
      confirmLabel: t("حذف المهمة", "Delete Task"),
      tone: "danger",
      icon: "trash",
    });
    if (!ok) return;

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      setTasks((prev) => prev.filter((item) => item.id !== task.id));
      push(t("تم حذف المهمة.", "Task deleted."), "info");
      return;
    }

    setBusy(true);
    const res = await supabase.from("study_tasks").delete().eq("id", task.id).select("id").single();
    if (res.error) push(t("تعذّر حذف المهمة.", "Could not delete task."), "error");
    else {
      push(t("تم حذف المهمة.", "Task deleted."), "info");
      await load();
    }
    setBusy(false);
  }

  // 6. Decks & Rich Card Composer Handlers
  async function createDeck(event: FormEvent) {
    event.preventDefault();
    if (!deckTitle.trim()) return;

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      const id = `preview-deck-${crypto.randomUUID()}`;
      setDecks((prev) => [
        {
          id,
          title: deckTitle.trim(),
          description: "",
          status: "active",
          source_type: linkedLesson ? "lesson" : "manual",
          source_version: null,
          lesson_id: linkedLesson?.id ?? null,
          updated_at: new Date().toISOString(),
        },
        ...prev,
      ]);
      setSelectedDeck(id);
      setDeckTitle("");
      push(t("تم إنشاء المجموعة في المعاينة.", "Deck created in preview."), "success");
      return;
    }

    if (busy) return;
    setBusy(true);
    const res = await supabase
      .from("flashcard_decks")
      .insert({
        user_id: currentUser.id,
        title: deckTitle.trim(),
        status: "active",
        source_type: linkedLesson ? "lesson" : "manual",
        lesson_id: linkedLesson?.id ?? null,
      })
      .select("id")
      .single();
    if (res.error) setError(t("تعذّر إنشاء المجموعة.", "Could not create deck."));
    else {
      setDeckTitle("");
      if (res.data) setSelectedDeck(res.data.id);
      push(t("تم إنشاء مجموعة البطاقات.", "Flashcard deck created."), "success");
      await load();
    }
    setBusy(false);
  }

  async function createCard(event: FormEvent) {
    event.preventDefault();
    if (!selectedDeck) return;

    const isCloze = cardType === "cloze";
    const cleanCloze = isCloze ? clozeText.trim() : null;
    const cleanFront = isCloze ? stripClozeMarkup(cleanCloze || front.trim()) : front.trim();
    const cleanBack = isCloze ? (back.trim() || stripClozeMarkup(cleanCloze || "")) : back.trim();
    if (!cleanFront || !cleanBack) return;

    const acceptedList = acceptedAnswersText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const meta = serializeCardMetadata({
      hint: cardHint.trim() || undefined,
      mnemonic: cardMnemonic.trim() || undefined,
      explanation: cardExplanation.trim() || undefined,
      matching_mode: matchingMode,
      normalize_alef: normalizeAlef || undefined,
      accepted_answers: acceptedList.length > 0 ? acceptedList : undefined,
      source: linkedLesson ? { lesson_id: linkedLesson.id } : undefined,
    });

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      setCards((prev) => [
        ...prev,
        {
          id: `preview-card-${crypto.randomUUID()}`,
          deck_id: selectedDeck,
          front: cleanFront,
          back: cleanBack,
          card_type: cardType,
          cloze_text: cleanCloze,
          position: prev.length + 1,
          state: "new",
          interval_days: 0,
          ease_factor: 2.5,
          repetitions: 0,
          lapses: 0,
          due_at: new Date().toISOString(),
          suspended: false,
          metadata: meta,
        },
      ]);
      setFront("");
      setBack("");
      setClozeText("");
      setCardHint("");
      setCardMnemonic("");
      setCardExplanation("");
      setAcceptedAnswersText("");
      push(t("تمت إضافة البطاقة.", "Flashcard added."), "success");
      return;
    }

    if (busy) return;
    setBusy(true);
    const res = await supabase
      .from("flashcards")
      .insert({
        deck_id: selectedDeck,
        user_id: currentUser.id,
        card_type: cardType,
        front: cleanFront,
        back: cleanBack,
        cloze_text: cleanCloze,
        position: cards.filter((c) => c.deck_id === selectedDeck).length + 1,
        metadata: meta as unknown as Json,
      })
      .select("id")
      .single();

    if (res.error) setError(t("تعذّر حفظ البطاقة.", "Could not save flashcard."));
    else {
      setFront("");
      setBack("");
      setClozeText("");
      setCardHint("");
      setCardMnemonic("");
      setCardExplanation("");
      setAcceptedAnswersText("");
      push(t("تمت إضافة البطاقة إلى المجموعة.", "Flashcard saved to deck."), "success");
      await load();
    }
    setBusy(false);
  }

  async function saveCardEdit(card: Card) {
    const cleanFront = card.card_type === "cloze" ? stripClozeMarkup(editCloze.trim() || editFront.trim()) : editFront.trim();
    const cleanBack = editBack.trim() || cleanFront;
    if (!cleanFront) return;

    const updatedMeta = serializeCardMetadata({
      ...card.metadata,
      hint: editHint.trim() || undefined,
    });

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === card.id
            ? {
                ...c,
                front: cleanFront,
                back: cleanBack,
                cloze_text: card.card_type === "cloze" ? editCloze.trim() : c.cloze_text,
                metadata: updatedMeta,
              }
            : c,
        ),
      );
      setEditingCard(null);
      push(t("تم تحديث البطاقة.", "Card updated."), "success");
      return;
    }

    if (busy) return;
    setBusy(true);
    const res = await supabase
      .from("flashcards")
      .update({
        front: cleanFront,
        back: cleanBack,
        cloze_text: card.card_type === "cloze" ? editCloze.trim() : null,
        metadata: updatedMeta as unknown as Json,
      })
      .eq("id", card.id)
      .select("id")
      .single();

    if (res.error) setError(t("تعذّر تعديل البطاقة.", "Could not update card."));
    else {
      setEditingCard(null);
      push(t("تم حفظ التعديلات.", "Changes saved."), "success");
      await load();
    }
    setBusy(false);
  }

  async function deleteCard(cardId: string) {
    const ok = await confirmAction({
      title: t("حذف هذه البطاقة؟", "Delete this flashcard?"),
      description: t("سيُحذف سجل البطاقة نهائياً من هذه المجموعة.", "This card will be permanently removed from this deck."),
      confirmLabel: t("حذف البطاقة", "Delete Card"),
      tone: "danger",
      icon: "trash",
    });
    if (!ok) return;

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      push(t("تم حذف البطاقة.", "Card removed."), "info");
      return;
    }

    setBusy(true);
    const res = await supabase.from("flashcards").delete().eq("id", cardId).select("id").single();
    if (res.error) setError(t("تعذّر حذف البطاقة.", "Could not delete card."));
    else {
      push(t("تم حذف البطاقة.", "Card deleted."), "info");
      await load();
    }
    setBusy(false);
  }

  async function handleBulkImport(imported: ImportedStudyCard[], newTitle?: string) {
    let targetId = selectedDeck;

    if (newTitle || !targetId) {
      const deckName = newTitle || t("مجموعة مستوردة", "Imported Study Deck");
      const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
        targetId = `preview-deck-${crypto.randomUUID()}`;
        setDecks((prev) => [
          {
            id: targetId!,
            title: deckName,
            description: t("مستوردة عبر محرك نقطة", "Imported via Noäta Bulk Importer"),
            status: "active",
            source_type: "manual",
            source_version: null,
            lesson_id: null,
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setSelectedDeck(targetId);
      } else {
        const res = await supabase
          .from("flashcard_decks")
          .insert({
            user_id: currentUser.id,
            title: deckName,
            status: "active",
            source_type: "manual",
          })
          .select("id")
          .single();
        if (res.error || !res.data) {
          push(t("تعذر إنشاء المجموعة للاستيراد.", "Could not create deck for import."), "error");
          return;
        }
        targetId = res.data.id;
        setSelectedDeck(targetId);
      }
    }

    const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
      const nowIso = new Date().toISOString();
      const added: Card[] = imported.map((item, idx) => ({
        id: `preview-card-${crypto.randomUUID()}`,
        deck_id: targetId!,
        front: item.front,
        back: item.back,
        card_type: item.card_type,
        cloze_text: item.cloze_text,
        position: cards.length + idx + 1,
        state: "new",
        interval_days: 0,
        ease_factor: 2.5,
        repetitions: 0,
        lapses: 0,
        due_at: nowIso,
        suspended: false,
        metadata: item.metadata,
      }));
      setCards((prev) => [...prev, ...added]);
      push(t(`تم استيراد ${added.length} بطاقة بنجاح!`, `Imported ${added.length} cards successfully!`), "success");
      return;
    }

    setBusy(true);
    const basePos = cards.filter((c) => c.deck_id === targetId).length;
    const rows = imported.map((item, idx) => ({
      deck_id: targetId!,
      user_id: account.user!.id,
      card_type: item.card_type,
      front: item.front,
      back: item.back,
      cloze_text: item.cloze_text,
      position: basePos + idx + 1,
      metadata: item.metadata as unknown as Json,
    }));
    const insertRes = await supabase.from("flashcards").insert(rows);
    setBusy(false);
    if (insertRes.error) {
      push(t("حدث خطأ أثناء استيراد البطاقات.", "Failed to insert imported cards."), "error");
      return;
    }
    push(t(`تم استيراد ${rows.length} بطاقة إلى حسابك!`, `Imported ${rows.length} cards to your account!`), "success");
    await load();
  }

  // Interleaved & Adaptive Queue Launchers
  function startInterleavedSession(deckIds: string[]) {
    const byDeck = deckIds.map((id) => cards.filter((c) => c.deck_id === id && !c.suspended));
    const mixed: Card[] = [];
    let idx = 0;
    let added = true;
    while (added && mixed.length < 120) {
      added = false;
      for (const bucket of byDeck) {
        if (idx < bucket.length) {
          mixed.push(bucket[idx]!);
          added = true;
        }
      }
      idx++;
    }
    if (mixed.length === 0) {
      push(t("لا توجد بطاقات نشطة في المجموعات المحددة.", "No active cards in selected decks."), "warning");
      return;
    }
    setCustomStudioCards({
      title: t("جلسة متداخلة متعددة المجموعات", "Multi-Deck Interleaved Session"),
      cards: mixed.map(mapCardToStudioItem),
      mode: "cram",
    });
    setReviewMode("cram");
    void recordStudySession({
      mode: "interleaved",
      title: t("جلسة متداخلة", "Interleaved Session"),
      deckIds,
      totalItems: mixed.length,
      completedItems: 0,
      correctItems: 0,
      completed: false,
    });
  }

  function startAdaptiveSession() {
    const now = Date.now();
    const prioritized = [...cards]
      .filter((c) => activeDeckIds.has(c.deck_id) && !c.suspended)
      .filter((c) => c.lapses > 0 || c.state === "relearning" || Date.parse(c.due_at) <= now)
      .sort((a, b) => b.lapses - a.lapses || Date.parse(a.due_at) - Date.parse(b.due_at));

    if (prioritized.length === 0) {
      push(t("لا توجد بطاقات متعثرة أو مستحقة حالياً!", "No high-lapse or due cards right now!"), "info");
      return;
    }

    setCustomStudioCards({
      title: t("جلسة معالجة نقاط الضعف التكيفية", "Adaptive High-Lapse Drill"),
      cards: prioritized.map(mapCardToStudioItem),
      mode: "spaced",
    });
    setReviewMode("spaced");
  }

  // Review Cards Source
  const activeStudioDeckCards = useMemo(() => {
    if (customStudioCards) return customStudioCards.cards;
    if (reviewMode === "spaced") return dueCards.map(mapCardToStudioItem);
    const pool = selectedDeck
      ? cards.filter((c) => c.deck_id === selectedDeck && !c.suspended)
      : cards.filter((c) => activeDeckIds.has(c.deck_id) && !c.suspended);
    return pool.map(mapCardToStudioItem);
  }, [activeDeckIds, cards, customStudioCards, dueCards, reviewMode, selectedDeck]);

  const TABS: Array<{ id: StudyTab; label: string; badge?: number; icon: string }> = [
    { id: "generator", label: t("توليد ذكي", "AI Studio"), icon: "sparkles" },
    { id: "quiz", label: t("اختبار تفاعلي", "Quiz & Exam"), icon: "check-circle" },
    { id: "review", label: t("مراجعة وألعاب", "Study & Drill"), badge: dueCards.length, icon: "review" },
    { id: "decks", label: t("المجموعات والبطاقات", "Decks"), badge: decks.length, icon: "layers" },
    { id: "tasks", label: t("خطة المذاكرة", "Tasks"), badge: openTasks.length, icon: "calendar" },
  ];

  return (
    <div data-tour-page="study">
      {/* Studio Hero Header */}
      <header className="noata-study-hero" data-tour="study-welcome">
        <div className="noata-study-hero-copy">
          <div className="noata-study-hero-kicker">
            <Badge tone="accent">
              <Icon name="sparkles" size={14} />
              <span>{t("منظومة الاسترجاع النشط 2.0", "Active Recall Ecosystem 2.0")}</span>
            </Badge>
            {!canSyncAccount ? (
              <Badge tone="warning">
                {t("معاينة محلية", "Local Preview")}
              </Badge>
            ) : null}
          </div>
          <h1>{t("استوديو نقطة للذكاء والمذاكرة النشطة", "Noäta Active Recall & Study Studio")}</h1>
          <p className="noata-study-muted">
            {t(
              "ولّد اختبارات وبطاقات في ثوانٍ، تدرب بالكتابة الدقيقة أو الحذف المتعدد أو سباق المطابقة، وتابع أخطاءك بدقة SM-2.",
              "Generate quizzes and flashcards in seconds, practice via cloze, typed recall, speed match or SM-2 spaced repetition, and master every mistake.",
            )}
          </p>
        </div>

        <div className="noata-study-hero-actions">
          <Button
            variant="primary"
            onClick={() => {
              setCustomStudioCards(null);
              setView("review");
            }}
          >
            <Icon name="play" size={16} />
            <span>
              {dueCards.length > 0
                ? t(`مراجعة المستحق (${dueCards.length})`, `Review Due (${dueCards.length})`)
                : t("فتح الاستوديو", "Open Studio")}
            </span>
          </Button>
          {!canSyncAccount ? (
            <Link href="/login" className="nk-btn nk-btn--secondary">
              <Icon name="lock" size={15} />
              <span>{t("تسجيل الدخول للمزامنة", "Sign in to Sync")}</span>
            </Link>
          ) : null}
        </div>
      </header>

      {/* Non-blocking Preview Banner when guest or offline */}
      {!canSyncAccount ? (
        <div className="noata-preview-banner" role="status">
          <Icon name="info" size={18} />
          <span>
            {t(
              "أنت تستخدم استوديو المذاكرة في وضع المعاينة المحلية. يمكنك تجربة البطاقات، الاختبارات، الاستيراد، وسباق المطابقة بحرية؛ سجّل الدخول لحفظ التقدم عبر أجهزتك.",
              "You are exploring Study Studio in local preview mode. Try quizzes, SM-2 cards, cloze, typed recall, and bulk import freely; sign in to sync across devices.",
            )}
          </span>
        </div>
      ) : null}

      {error ? (
        <div className="noata-study-error-banner" role="alert">
          <Icon name="alert-circle" size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Top Navigation Tabs — strict role="tablist" with direct role="tab" buttons */}
      <nav
        className="noata-study-tabs"
        data-tour="study-sections"
        role="tablist"
        aria-label={t("أقسام مركز المذاكرة", "Study Center Tabs")}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={view === tab.id}
            className="noata-study-tab-btn"
            onClick={() => setView(tab.id)}
          >
            <Icon name={tab.icon} size={16} />
            <span>{tab.label}</span>
            {typeof tab.badge === "number" && tab.badge > 0 ? (
              <span className="noata-study-tab-badge">{tab.badge}</span>
            ) : null}
          </button>
        ))}
      </nav>

      {/* ===================================================================== */}
      {/* TAB 1: SMART STUDY GENERATOR                                          */}
      {/* ===================================================================== */}
      {view === "generator" ? (
        <section className="noata-generator-panel" data-tour="study-generator">
          <div className="noata-gen-head">
            <div>
              <h2>{t("مولّد الحزم والاختبارات الذكي", "Smart Quiz & Flashcard Generator")}</h2>
              <p className="noata-study-muted">
                {t(
                  "حوّل أي موضوع أو نص دراسي إلى اختبار تفاعلي مع تلميحات ومفاتيح تذكر وبطاقات استرجاع جاهزة للتصدير أو الحفظ.",
                  "Turn any topic, lesson, or notes into an interactive quiz, rationales, and study flashcards ready to practice or export.",
                )}
              </p>
            </div>
            {linkedLesson ? (
              <Badge tone="accent" icon="book">
                {linkedLesson.title}
              </Badge>
            ) : null}
          </div>

          <div className="noata-gen-source-pills" role="group" aria-label={t("مصدر التوليد", "Generation Source")}>
            {(
              [
                { id: "topic", label: t("حسب الموضوع أو المفهوم", "By Topic / Subject") },
                { id: "text", label: t("من نص أو ملاحظاتك", "Paste Notes / Text") },
                { id: "lesson", label: t("مرتبط بدرس المنهج", "Linked Lesson") },
              ] as const
            ).map((src) => (
              <button
                key={src.id}
                type="button"
                className={`noata-pill-choice ${genSource === src.id ? "is-selected" : ""}`}
                onClick={() => setGenSource(src.id)}
              >
                {src.label}
              </button>
            ))}
          </div>

          <div className="noata-gen-form-grid">
            <label className="noata-field-block">
              <span>{t("عنوان الموضوع أو الدرس", "Topic or Lesson Title")}</span>
              <input
                className="nk-input"
                type="text"
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                placeholder={t("مثال: قوانين نيوتن، البلاغة العربية، الدوال المثلثية…", "e.g., Newton's Laws, Cell Mitosis, Calculus Derivatives…")}
              />
            </label>

            <label className="noata-field-block">
              <span>{t("مستوى الصعوبة", "Difficulty")}</span>
              <select
                className="nk-input"
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value as QuizDifficulty)}
              >
                <option value="easy">{t("تمهيدي (أساسي)", "Foundational (Easy)")}</option>
                <option value="medium">{t("قياسي (متوازن)", "Standard (Medium)")}</option>
                <option value="hard">{t("تحدّي متقدم", "Mastery Challenge (Hard)")}</option>
              </select>
            </label>

            <label className="noata-field-block">
              <span>{t("عدد الأسئلة", "Questions")}</span>
              <select
                className="nk-input"
                value={genQuestionCount}
                onChange={(e) => setGenQuestionCount(Number(e.target.value))}
              >
                {[3, 5, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} {t("أسئلة", "questions")}
                  </option>
                ))}
              </select>
            </label>

            <label className="noata-field-block">
              <span>{t("عدد البطاقات", "Flashcards")}</span>
              <select
                className="nk-input"
                value={genCardCount}
                onChange={(e) => setGenCardCount(Number(e.target.value))}
              >
                {[4, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} {t("بطاقات", "cards")}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {genSource === "text" ? (
            <label className="noata-field-block">
              <span>{t("المحتوى الدراسي أو الملخص", "Study Notes or Excerpt")}</span>
              <textarea
                className="nk-input"
                rows={4}
                value={genText}
                onChange={(e) => setGenText(e.target.value)}
                placeholder={t("الصق فقرات الدرس أو التعاريف هنا لتحويلها إلى أسئلة وبطاقات…", "Paste notes, definitions, or an excerpt to convert into questions and cards…")}
              />
            </label>
          ) : null}

          <div className="noata-gen-submit-row">
            <Button
              variant="primary"
              disabled={generating || (!genTopic.trim() && genSource !== "text") || (genSource === "text" && !genText.trim())}
              onClick={() => void handleGenerateBundle()}
            >
              <Icon name="sparkles" size={16} />
              <span>
                {generating
                  ? t("جارٍ بناء الاختبار والبطاقات…", "Synthesizing Bundle…")
                  : t("توليد الحزمة التفاعلية", "Generate Smart Bundle")}
              </span>
            </Button>
          </div>

          {activeBundle ? (
            <article className="noata-bundle-preview-card">
              <div className="noata-bundle-preview-head">
                <div>
                  <div className="noata-bundle-badges" style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                    <Badge tone="success">{t("حزمة جاهزة للاستخدام", "Bundle Ready")}</Badge>
                    <Badge
                      tone={
                        activeBundle.provenance === "curriculum_derived"
                          ? "accent"
                          : activeBundle.provenance === "ai_supplementary"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {activeBundle.provenance === "curriculum_derived"
                        ? t("مشتق من المنهج", "Curriculum-Derived Source")
                        : activeBundle.provenance === "user_notes"
                          ? t("مستند إلى ملاحظاتك", "User Notes")
                          : t("شرح AI مساند", "AI Supplementary Explanation")}
                    </Badge>
                    {activeBundle.aiStatus === "fanar_ai" ? (
                      <Badge tone="accent">{t("توليد Fanar AI", "Fanar AI Synthesized")}</Badge>
                    ) : null}
                  </div>
                  <h3>{activeBundle.title}</h3>
                  <div className="noata-study-muted">
                    <StudyRichText content={activeBundle.summary} />
                  </div>
                </div>
                <div className="noata-bundle-actions">
                  <Button variant="primary" onClick={() => setView("quiz")}>
                    <Icon name="play" size={16} />
                    <span>{t("بدء الاختبار التفاعلي", "Launch Interactive Quiz")}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCustomStudioCards({
                        title: activeBundle.title,
                        mode: "cram",
                        cards: activeBundle.cards.map((c) => ({
                          id: c.id,
                          front: c.front,
                          back: c.back,
                          hint: c.hint,
                          mnemonic: c.mnemonic,
                          concept: c.concept,
                        })),
                      });
                      setReviewMode("cram");
                      setView("review");
                    }}
                  >
                    <Icon name="layers" size={16} />
                    <span>{t("دراسة البطاقات", "Study Flashcards")}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={() =>
                      void saveCardsToNewDeck(activeBundle.title, activeBundle.summary, activeBundle.cards, "ai_draft")
                    }
                  >
                    <Icon name="bookmark" size={16} />
                    <span>{t("حفظ في مجموعاتي", "Save to Decks")}</span>
                  </Button>
                  <Button variant="ghost" onClick={() => handleExportAnki(activeBundle.cards)}>
                    <Icon name="download" size={16} />
                    <span>{t("تصدير Anki", "Export Anki")}</span>
                  </Button>
                </div>
              </div>

              {activeBundle.keyTakeaways.length > 0 ? (
                <ul className="noata-bundle-takeaways">
                  {activeBundle.keyTakeaways.map((kt, idx) => (
                    <li key={idx}>
                      <StudyRichText content={kt} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ) : null}
        </section>
      ) : null}

      {/* ===================================================================== */}
      {/* TAB 2: INTERACTIVE QUIZ & STRICT EXAM SIMULATOR                       */}
      {/* ===================================================================== */}
      {view === "quiz" ? (
        <section data-tour="study-quiz" data-tour-critical="true">
          {!activeBundle ? (
            <EmptyState
              icon="check-circle"
              title={t("لا يوجد اختبار نشط بعد", "No Active Quiz Loaded")}
              description={t(
                "أنشئ حزمة مذاكرة من تبويب «توليد ذكي» أو ابدأ مباشرة باختبار سريع نموذجياً لتجربة وضعي المعلم والامتحان الصارم.",
                "Create a custom bundle from AI Studio or launch a quick sample assessment to test Tutor & Strict Exam modes.",
              )}
              actions={
                <div className="noata-empty-actions">
                  <Button variant="primary" onClick={() => setView("generator")}>
                    <Icon name="sparkles" size={16} />
                    <span>{t("الانتقال للمولد الذكي", "Go to AI Studio")}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setGenTopic(isEn ? "Physics & Active Recall" : "مبادئ الفيزياء والاسترجاع");
                      void generateQuizGeckoBundle({
                        topic: isEn ? "Physics & Active Recall" : "مبادئ الفيزياء والاسترجاع",
                        difficulty: "medium",
                        locale: locale as "ar" | "en",
                        questionCount: 4,
                        cardCount: 4,
                      }).then((b) => setActiveBundle(b));
                    }}
                  >
                    <Icon name="play" size={16} />
                    <span>{t("بدء اختبار تجريبي سريع", "Start Quick Sample Quiz")}</span>
                  </Button>
                </div>
              }
            />
          ) : (
            <InteractiveQuizRunner
              bundle={activeBundle}
              userId={userId}
              authEpoch={account.revision.current}
              onFinish={(score, _missed, mistakeRecords: QuizMistakeRecord[]) => {
                for (const m of mistakeRecords) {
                  void handleLogMistake({
                    sourceType: m.sourceType,
                    topic: m.topic,
                    prompt: m.prompt,
                    userAnswer: m.userAnswer,
                    expectedAnswer: m.expectedAnswer,
                    explanation: m.explanation,
                  });
                }
                void recordStudySession({
                  mode: mistakeRecords.some((m) => m.sourceType === "exam") ? "exam_sim" : "practice_quiz",
                  title: activeBundle.title,
                  deckIds: [],
                  totalItems: activeBundle.questions.length,
                  completedItems: activeBundle.questions.length,
                  correctItems: Math.round((score / 100) * activeBundle.questions.length),
                  completed: true,
                });
              }}
              onSaveRemedialDeck={async (_score, missedCards) => {
                if (missedCards.length === 0) return;
                await saveCardsToNewDeck(
                  t(`علاج أخطاء: ${activeBundle.title}`, `Remedial: ${activeBundle.title}`),
                  t("بطاقات مخصصة للأسئلة التي أخطأت فيها أثناء الاختبار.", "Targeted cards generated from missed quiz questions."),
                  missedCards,
                  "ai_draft",
                );
              }}
              onRestart={() => {
                setView("generator");
              }}
            />
          )}
        </section>
      ) : null}

      {/* ===================================================================== */}
      {/* TAB 3: STUDY & DRILL STUDIO (SM-2, Cram, Cloze, Typed, Match, Hub)    */}
      {/* ===================================================================== */}
      {view === "review" ? (
        <section data-tour="study-review" data-tour-critical="true">
          <div className="noata-review-mode-strip" role="group" aria-label={t("أنماط الاستوديو", "Study Studio Modes")}>
            {(
              [
                { id: "spaced", label: t(`المستحق اليوم (SM-2 · ${dueCards.length})`, `SM-2 Due (${dueCards.length})`), icon: "clock" },
                { id: "cram", label: t("تدريب حر وكتابي / الحذف", "Cram, Cloze & Typed"), icon: "review" },
                { id: "speed_match", label: t("سباق المطابقة السريعة", "Speed Match Sprint"), icon: "zap" },
                { id: "mistake_hub", label: t("الأخطاء والتداخل والتكيف", "Mistakes, Mix & Adaptive"), icon: "target" },
              ] as const
            ).map((modeBtn) => (
              <button
                key={modeBtn.id}
                type="button"
                className={`noata-mode-card-btn ${reviewMode === modeBtn.id && !customStudioCards ? "is-active" : ""}`}
                onClick={() => {
                  setCustomStudioCards(null);
                  setReviewMode(modeBtn.id);
                }}
              >
                <Icon name={modeBtn.icon} size={16} />
                <span>{modeBtn.label}</span>
              </button>
            ))}
          </div>

          {customStudioCards ? (
            <div className="noata-custom-session-banner">
              <span>{t(`وضع مخصص: ${customStudioCards.title}`, `Custom Session: ${customStudioCards.title}`)}</span>
              <Button size="sm" variant="ghost" onClick={() => setCustomStudioCards(null)}>
                {t("إغلاق الوضع المخصص", "Clear Custom Session")}
              </Button>
            </div>
          ) : null}

          {reviewMode === "speed_match" && !customStudioCards ? (
            <StudySpeedMatch
              cards={activeStudioDeckCards}
              deckTitle={selectedDeckObj?.title ?? t("جميع المجموعات", "All Active Decks")}
              onLogMistake={(m) => {
                void handleLogMistake({
                  cardId: m.cardId,
                  deckId: selectedDeck,
                  sourceType: "flashcard",
                  topic: m.topic,
                  prompt: m.prompt,
                  userAnswer: m.userAnswer,
                  expectedAnswer: m.expectedAnswer,
                  explanation: m.explanation,
                });
              }}
              onSessionComplete={(summary) => {
                void recordStudySession({
                  mode: "speed_match",
                  title: selectedDeckObj?.title ?? t("سباق المطابقة السريعة", "Speed Match Sprint"),
                  deckIds: selectedDeck ? [selectedDeck] : [],
                  totalItems: summary.totalPairs,
                  completedItems: summary.totalPairs,
                  correctItems: Math.max(0, summary.totalPairs - summary.mistakesCount),
                  completed: true,
                });
              }}
              onExit={() => setReviewMode("spaced")}
            />
          ) : reviewMode === "mistake_hub" && !customStudioCards ? (
            <StudyMistakeHub
              decks={deckSummaries}
              mistakes={mistakes}
              sessions={sessions}
              busy={busy}
              onStartInterleaved={startInterleavedSession}
              onStartAdaptive={startAdaptiveSession}
              onStartMistakeDrill={(drillCards, title) => {
                setCustomStudioCards({ title, cards: drillCards, mode: "cram" });
              }}
              onToggleResolveMistake={async (mistake, resolved) => {
                const resolvedAt = resolved ? new Date().toISOString() : null;
                const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
                  setMistakes((prev) => prev.map((m) => (m.id === mistake.id ? { ...m, resolved_at: resolvedAt } : m)));
                  return;
                }
                await supabase.from("study_mistake_logs").update({ resolved_at: resolvedAt }).eq("id", mistake.id);
                await load();
              }}
              onDeleteMistake={async (mistakeId) => {
                const currentUser = account.user;
    if (!canSyncAccount || !currentUser) {
                  setMistakes((prev) => prev.filter((m) => m.id !== mistakeId));
                  return;
                }
                await supabase.from("study_mistake_logs").delete().eq("id", mistakeId);
                await load();
              }}
              onCompleteSession={async (sessionId) => {
                const currentUser = account.user;
      if (!canSyncAccount || !currentUser) return;
                await supabase
                  .from("study_sessions")
                  .update({ status: "completed", completed_at: new Date().toISOString() })
                  .eq("id", sessionId);
                await load();
              }}
            />
          ) : (
            <FlashcardReviewStudio
              deckTitle={
                customStudioCards?.title ??
                (reviewMode === "spaced"
                  ? t("البطاقات المستحقة اليوم", "Today's Spaced Queue")
                  : selectedDeckObj?.title ?? t("تدريب مفتوح", "Open Cram Session"))
              }
              cards={activeStudioDeckCards}
              sessionKind={customStudioCards?.mode ?? (reviewMode === "spaced" ? "spaced" : "cram")}
              canPersistRatings={canSyncAccount}
              busy={busy}
              onRateCard={reviewCard}
              onSuspendCard={handleSuspendCard}
              onLogMistake={(entry) => {
                void handleLogMistake({
                  cardId: entry.cardId,
                  deckId: selectedDeck,
                  sourceType: entry.sourceType,
                  topic: entry.topic,
                  prompt: entry.prompt,
                  userAnswer: entry.userAnswer,
                  expectedAnswer: entry.expectedAnswer,
                  explanation: entry.explanation,
                });
              }}
              onFinish={() => {
                setCustomStudioCards(null);
                push(t("أحسنت! أُنجزت جلسة الاسترجاع.", "Great job completing this recall session!"), "success");
              }}
            />
          )}
        </section>
      ) : null}

      {/* ===================================================================== */}
      {/* TAB 4: DECKS, COMPOSER, METADATA & BULK IMPORT / EXPORT               */}
      {/* ===================================================================== */}
      {view === "decks" ? (
        <section className="content-grid" data-tour="study-decks">
          {/* Left Column: Deck Switcher & Composer */}
          <div className="noata-decks-sidebar">
            <article className="card">
              <h3>{t("مجموعاتك الدراسية", "Your Study Decks")}</h3>
              <form className="noata-deck-create-form" onSubmit={(e) => void createDeck(e)}>
                <input
                  className="nk-input"
                  type="text"
                  value={deckTitle}
                  onChange={(e) => setDeckTitle(e.target.value)}
                  placeholder={t("اسم مجموعة جديدة…", "New deck title…")}
                  aria-label={t("اسم المجموعة الجديدة", "New deck title")}
                />
                <Button type="submit" variant="primary" disabled={!deckTitle.trim() || busy}>
                  <Icon name="plus" size={16} />
                  <span>{t("إنشاء", "Create")}</span>
                </Button>
              </form>

              <ul className="noata-deck-list">
                {decks.map((deck) => {
                  const summary = deckSummaries.find((s) => s.id === deck.id);
                  return (
                    <li key={deck.id}>
                      <button
                        type="button"
                        className={`noata-deck-item-btn ${selectedDeck === deck.id ? "is-selected" : ""}`}
                        onClick={() => setSelectedDeck(deck.id)}
                      >
                        <div>
                          <strong>{deck.title}</strong>
                          <small className="noata-study-muted">{deck.source_type}</small>
                        </div>
                        <div className="noata-deck-counts">
                          <Badge tone="neutral">{summary?.cardCount ?? 0}</Badge>
                          {(summary?.dueCount ?? 0) > 0 ? (
                            <Badge tone="warning">{summary?.dueCount} {t("مستحق", "due")}</Badge>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          </div>

          {/* Right Column: Card Composer + Card List + Bulk Import/Export */}
          <div className="noata-decks-main">
            {selectedDeckObj ? (
              <article className="card">
                <div className="noata-deck-header-row">
                  <div>
                    <h2>{selectedDeckObj.title}</h2>
                    {selectedDeckObj.description ? (
                      <p className="noata-study-muted">{selectedDeckObj.description}</p>
                    ) : null}
                  </div>
                  <div className="noata-deck-header-actions">
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={selectedCards.length === 0}
                      onClick={() => {
                        setCustomStudioCards(null);
                        setReviewMode("cram");
                        setView("review");
                      }}
                    >
                      <Icon name="play" size={15} />
                      <span>{t("مذاكرة هذه المجموعة", "Study This Deck")}</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={selectedCards.length < 2}
                      onClick={() => {
                        setCustomStudioCards(null);
                        setReviewMode("speed_match");
                        setView("review");
                      }}
                    >
                      <Icon name="zap" size={15} />
                      <span>{t("مطابقة سريعة", "Speed Match")}</span>
                    </Button>
                  </div>
                </div>

                {/* Rich Flashcard & Cloze Composer */}
                <form className="noata-card-composer" onSubmit={(e) => void createCard(e)}>
                  <div className="noata-composer-type-row">
                    <span>{t("نوع البطاقة:", "Card Type:")}</span>
                    {(
                      [
                        { id: "term_definition", label: t("مفهوم / تعريف", "Term / Def") },
                        { id: "question_answer", label: t("سؤال / إجابة", "Q & A") },
                        { id: "cloze", label: t("ملء فراغات (Cloze)", "Cloze {{c1::}}") },
                      ] as const
                    ).map((ct) => (
                      <button
                        key={ct.id}
                        type="button"
                        className={`noata-chip-btn ${cardType === ct.id ? "is-active" : ""}`}
                        onClick={() => setCardType(ct.id)}
                      >
                        {ct.label}
                      </button>
                    ))}
                  </div>

                  {cardType === "cloze" ? (
                    <label className="noata-field-block">
                      <span>{t("نص الحذف المتعدد {{c1::الإجابة::تلميح}}", "Cloze sentence {{c1::answer::hint}}")}</span>
                      <textarea
                        className="nk-input"
                        rows={3}
                        value={clozeText}
                        onChange={(e) => setClozeText(e.target.value)}
                        placeholder={t(
                          "مثال: يتكون الماء من {{c1::هيدروجين}} و{{c2::أكسجين::عنصر أساسي}}.",
                          "Example: Water consists of {{c1::hydrogen}} and {{c2::oxygen::essential gas}}.",
                        )}
                      />
                    </label>
                  ) : (
                    <div className="noata-composer-pair-grid">
                      <label className="noata-field-block">
                        <span>{t("الوجه الأمامي (يدعم Markdown و KaTeX)", "Front Prompt (Markdown & KaTeX)")}</span>
                        <textarea
                          className="nk-input"
                          rows={2}
                          value={front}
                          onChange={(e) => setFront(e.target.value)}
                          placeholder={t("مثال: احسب $E = mc^2$", "e.g., Calculate derivative of $\\sin(x)$")}
                        />
                      </label>
                      <label className="noata-field-block">
                        <span>{t("الإجابة (الوجه الخلفي)", "Back Answer")}</span>
                        <textarea
                          className="nk-input"
                          rows={2}
                          value={back}
                          onChange={(e) => setBack(e.target.value)}
                          placeholder={t("الإجابة النموذجية…", "Canonical answer…")}
                        />
                      </label>
                    </div>
                  )}

                  {/* Metadata & Matching Controls */}
                  <div className="noata-composer-meta-grid">
                    <label className="noata-field-block">
                      <span>{t("تلميح اختياري", "Optional Hint")}</span>
                      <input
                        className="nk-input"
                        type="text"
                        value={cardHint}
                        onChange={(e) => setCardHint(e.target.value)}
                      />
                    </label>

                    <label className="noata-field-block">
                      <span>{t("نمط مطابقة الإجابة الكتابية", "Typed Matching Mode")}</span>
                      <select
                        className="nk-input"
                        value={matchingMode}
                        onChange={(e) => setMatchingMode(e.target.value as MatchingMode)}
                      >
                        <option value="normalized">{t("قياسي (يزيل التشكيل، لا يخلط ة/ه)", "Normalized (strict ة vs ه)")}</option>
                        <option value="strict">{t("صارم تماماً", "Strict Exact")}</option>
                        <option value="fuzzy">{t("مرن (تنبيه تقارب الإملاء)", "Fuzzy (close-match assist)")}</option>
                      </select>
                    </label>

                    <label className="noata-field-block">
                      <span>{t("مفتاح التذكر (Mnemonic)", "Mnemonic")}</span>
                      <input
                        className="nk-input"
                        type="text"
                        value={cardMnemonic}
                        onChange={(e) => setCardMnemonic(e.target.value)}
                      />
                    </label>

                    <label className="noata-field-block">
                      <span>{t("بدائل مقبولة (مفصولة بفاصلة)", "Accepted Variants (comma separated)")}</span>
                      <input
                        className="nk-input"
                        type="text"
                        value={acceptedAnswersText}
                        onChange={(e) => setAcceptedAnswersText(e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="noata-composer-foot">
                    <label className="noata-inline-check">
                      <input
                        type="checkbox"
                        checked={normalizeAlef}
                        onChange={(e) => setNormalizeAlef(e.target.checked)}
                      />
                      <span>{t("توحيد أشكال الألف (أ/إ/آ -> ا) عند الكتابة", "Normalize Alef variants (أ/إ/آ -> ا)")}</span>
                    </label>

                    <Button type="submit" variant="primary" disabled={busy}>
                      <Icon name="plus" size={16} />
                      <span>{t("إضافة البطاقة", "Add Card")}</span>
                    </Button>
                  </div>
                </form>

                {/* Live KaTeX Preview when authoring */}
                {(front.trim() || back.trim() || clozeText.trim()) ? (
                  <div className="noata-live-katex-preview" aria-label={t("معاينة النص والمعادلات", "Live formula & markdown preview")}>
                    <small>{t("معاينة حية:", "Live Render Preview:")}</small>
                    <StudyRichText content={cardType === "cloze" ? clozeText : `${front}\n\n—\n\n${back}`} />
                  </div>
                ) : null}

                {/* Cards List Filter + Print/List */}
                <div className="noata-deck-cards-bar">
                  <h3>{t(`البطاقات (${selectedCards.length})`, `Cards (${selectedCards.length})`)}</h3>
                  <input
                    className="nk-input noata-deck-search"
                    type="search"
                    value={deckSearch}
                    onChange={(e) => setDeckSearch(e.target.value)}
                    placeholder={t("ابحث داخل البطاقات…", "Filter cards…")}
                    aria-label={t("البحث في البطاقات", "Search cards")}
                  />
                </div>

                {selectedCards.length === 0 ? (
                  <p className="noata-study-muted">
                    {t("لا توجد بطاقات مطابقة في هذه المجموعة.", "No matching cards in this deck.")}
                  </p>
                ) : (
                  <ul className="noata-deck-card-list">
                    {selectedCards.map((card) => (
                      <li key={card.id} className={`noata-deck-card-row ${card.suspended ? "is-suspended" : ""}`}>
                        {editingCard === card.id ? (
                          <div className="noata-card-edit-form">
                            {card.card_type === "cloze" ? (
                              <textarea
                                className="nk-input"
                                rows={2}
                                value={editCloze}
                                onChange={(e) => setEditCloze(e.target.value)}
                              />
                            ) : (
                              <>
                                <input
                                  className="nk-input"
                                  type="text"
                                  value={editFront}
                                  onChange={(e) => setEditFront(e.target.value)}
                                />
                                <input
                                  className="nk-input"
                                  type="text"
                                  value={editBack}
                                  onChange={(e) => setEditBack(e.target.value)}
                                />
                              </>
                            )}
                            <input
                              className="nk-input"
                              type="text"
                              value={editHint}
                              onChange={(e) => setEditHint(e.target.value)}
                              placeholder={t("تلميح…", "Hint…")}
                            />
                            <div className="noata-row-actions">
                              <Button size="sm" variant="primary" onClick={() => void saveCardEdit(card)}>
                                {t("حفظ", "Save")}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingCard(null)}>
                                {t("إلغاء", "Cancel")}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="noata-deck-card-content">
                              <div className="noata-deck-card-badges">
                                <Badge tone="neutral">{card.card_type}</Badge>
                                <Badge tone={card.lapses > 0 ? "warning" : "accent"}>
                                  {card.state} · {card.interval_days}d
                                </Badge>
                                {card.suspended ? <Badge tone="danger">{t("معلقة", "Suspended")}</Badge> : null}
                              </div>
                              <div className="noata-deck-card-front">
                                <StudyRichText content={card.card_type === "cloze" && card.cloze_text ? card.cloze_text : card.front} />
                              </div>
                              {card.card_type !== "cloze" ? (
                                <div className="noata-deck-card-back">
                                  <StudyRichText content={card.back} />
                                </div>
                              ) : null}
                            </div>
                            <div className="noata-row-actions">
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={t("تعديل البطاقة", "Edit card")}
                                onClick={() => {
                                  setEditingCard(card.id);
                                  setEditFront(card.front);
                                  setEditBack(card.back);
                                  setEditHint(card.metadata.hint ?? "");
                                  setEditCloze(card.cloze_text ?? "");
                                }}
                              >
                                <Icon name="edit" size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={card.suspended ? t("إلغاء تعليق البطاقة", "Unsuspend card") : t("تعليق البطاقة", "Suspend card")}
                                onClick={() => void handleSuspendCard(card.id, !card.suspended)}
                              >
                                <Icon name={card.suspended ? "eye" : "eye-off"} size={14} />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label={t("حذف البطاقة", "Delete card")}
                                onClick={() => void deleteCard(card.id)}
                              >
                                <Icon name="trash" size={14} />
                              </Button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ) : null}

            {/* Bulk Import / Export Box */}
            <article className="card">
              <StudyImportExport
                targetDeckTitle={selectedDeckObj?.title}
                deckCards={selectedCards.map((c) => ({
                  front: c.front,
                  back: c.back,
                  card_type: c.card_type,
                  cloze_text: c.cloze_text,
                  hint: c.metadata.hint,
                }))}
                busy={busy}
                onImportCards={handleBulkImport}
              />
            </article>
          </div>
        </section>
      ) : null}

      {/* ===================================================================== */}
      {/* TAB 5: STUDY TASKS PLANNER                                            */}
      {/* ===================================================================== */}
      {view === "tasks" ? (
        <section className="content-grid" data-tour="study-tasks">
          <article className="card">
            <h3>{t("إضافة مهمة مذاكرة", "Add Study Task")}</h3>
            <form className="noata-task-form" onSubmit={(e) => void createTask(e)}>
              <label className="noata-field-block">
                <span>{t("المهمة", "Task Title")}</span>
                <input
                  className="nk-input"
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder={t("مثال: حل 10 بطاقات فيزياء قبل الغد", "e.g., Review 10 calculus flashcards")}
                />
              </label>

              <div className="noata-composer-pair-grid">
                <label className="noata-field-block">
                  <span>{t("الموعد المستهدف", "Target Due Date")}</span>
                  <input
                    className="nk-input"
                    type="datetime-local"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                  />
                </label>

                <label className="noata-field-block">
                  <span>{t("الأولوية", "Priority")}</span>
                  <select
                    className="nk-input"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                  >
                    <option value="low">{t("منخفضة", "Low")}</option>
                    <option value="normal">{t("عادية", "Normal")}</option>
                    <option value="high">{t("عالية", "High")}</option>
                  </select>
                </label>
              </div>

              <Button type="submit" variant="primary" disabled={!taskTitle.trim() || busy}>
                <Icon name="plus" size={16} />
                <span>{t("حفظ المهمة", "Save Task")}</span>
              </Button>
            </form>
          </article>

          <article className="card">
            <h3>{t(`مهامك الحالية (${tasks.length})`, `Your Study Tasks (${tasks.length})`)}</h3>
            {loading ? (
              <p className="noata-study-muted">{t("جارٍ تحميل المهام…", "Loading tasks…")}</p>
            ) : tasks.length === 0 ? (
              <EmptyState
                icon="calendar"
                title={t("قائمة مهامك فارغة", "No study tasks scheduled")}
                description={t("أضف خطوات مراجعة صغيرة لتنظيم جلسات الأسبوع.", "Add focused study steps to pace your week.")}
              />
            ) : (
              <ul className="noata-task-list">
                {tasks.map((task) => {
                  const done = task.status === "completed";
                  return (
                    <li key={task.id} className={`noata-task-row ${done ? "is-done" : ""}`}>
                      <label className="noata-task-check">
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={busy}
                          onChange={(e) => void setTaskState(task, e.target.checked)}
                        />
                        <span>{task.title}</span>
                      </label>

                      <div className="noata-row-actions">
                        <Badge tone={task.priority === "high" ? "danger" : task.priority === "normal" ? "accent" : "neutral"}>
                          {task.priority}
                        </Badge>
                        {task.due_at ? (
                          <small className="noata-study-muted">
                            {new Date(task.due_at).toLocaleDateString(isEn ? "en-US" : "ar-EG")}
                          </small>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          aria-label={t("حذف المهمة", "Delete task")}
                          onClick={() => void removeTask(task)}
                        >
                          <Icon name="trash" size={14} />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </section>
      ) : null}
    </div>
  );
}
