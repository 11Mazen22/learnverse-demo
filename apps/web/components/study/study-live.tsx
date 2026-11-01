"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { Icon } from "@/components/ui/icon";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/client";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import {
  type QuizGeckoBundle,
  type QuizItem,
  type QuizFlashcard,
  type QuizDifficulty,
  generateQuizGeckoBundle,
  exportToAnkiTSV,
} from "@/lib/study/quizgecko-engine";
import { InteractiveQuizRunner } from "@/components/study/interactive-quiz-runner";
import { FlashcardReviewStudio } from "@/components/study/flashcard-review-studio";

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
  position: number;
  state: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
  lapses: number;
  due_at: string;
  suspended: boolean;
};

type ReviewReceipt = {
  card_id?: string;
  due_at?: string;
  interval_days?: number;
  duplicate?: boolean;
};

export function StudyLive() {
  const t = useTranslation();
  const locale = useLocale();
  const isEn = locale === "en";
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();

  // Tab View
  const [view, setView] = useState<"generator" | "quiz" | "review" | "decks" | "tasks">("generator");

  // Database Data
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const reviewKeys = useRef(new Map<string, string>());

  // Generator State
  const [genSource, setGenSource] = useState<"topic" | "lesson" | "text">("topic");
  const [genTopic, setGenTopic] = useState("");
  const [genText, setGenText] = useState("");
  const [genDifficulty, setGenDifficulty] = useState<QuizDifficulty>("medium");
  const [genQuestionCount, setGenQuestionCount] = useState(5);
  const [genCardCount, setGenCardCount] = useState(6);
  const [generating, setGenerating] = useState(false);
  const [activeBundle, setActiveBundle] = useState<QuizGeckoBundle | null>(null);

  // Lesson link from query param
  const [linkedLesson, setLinkedLesson] = useState<{ id: string; title: string; summary?: string } | null>(null);

  // Tasks form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");

  // Decks & Cards form state
  const [deckTitle, setDeckTitle] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  const load = useCallback(async () => {
    if (!account.user) {
      setTasks([]);
      setDecks([]);
      setCards([]);
      setLoading(false);
      return;
    }
    const revision = account.revision.current;
    setLoading(true);
    setError("");

    const [taskResult, deckResult, cardResult] = await Promise.all([
      supabase
        .from("study_tasks")
        .select("id,title,notes,task_type,priority,status,due_at,completed_at,recommendation_reason")
        .eq("user_id", account.user.id)
        .order("status")
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(200),
      supabase
        .from("flashcard_decks")
        .select("id,title,description,status,source_type,source_version,lesson_id,updated_at")
        .eq("user_id", account.user.id)
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("flashcards")
        .select("id,deck_id,front,back,card_type,position,state,interval_days,ease_factor,repetitions,lapses,due_at,suspended")
        .eq("user_id", account.user.id)
        .order("position")
        .limit(1000),
    ]);

    if (revision !== account.revision.current) return;
    if (taskResult.error || deckResult.error || cardResult.error) {
      setError(
        t(
          "مساحة المذاكرة غير متاحة في هذه البيئة بعد. لم نحفظ أو نفترض أي مهام أو بطاقات.",
          "The study workspace is not available in this environment yet. No tasks or cards were assumed or saved."
        )
      );
    } else {
      setTasks((taskResult.data ?? []) as StudyTask[]);
      setDecks((deckResult.data ?? []) as Deck[]);
      setCards((cardResult.data ?? []) as Card[]);
      setSelectedDeck((current) =>
        current && (deckResult.data ?? []).some((deck) => deck.id === current)
          ? current
          : deckResult.data?.[0]?.id ?? null
      );
    }
    setLoading(false);
  }, [account.revision, account.user, supabase, t]);

  // Handle URL query parameters (e.g. ?lesson=...&title=...)
  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const lessonId = parameters.get("lesson");
    const title = parameters.get("title")?.trim();
    const tab = parameters.get("tab");

    if (tab && ["generator", "quiz", "review", "decks", "tasks"].includes(tab)) {
      setView(tab as any);
    }

    if (lessonId && title) {
      setLinkedLesson({ id: lessonId, title });
      setGenSource("lesson");
      setGenTopic(title);
      setTaskTitle((current) => current || t(`مذاكرة: ${title}`, `Study: ${title}`));
      setDeckTitle((current) => current || title.slice(0, 160));
    }

    reviewKeys.current.clear();
    setNotice("");
    if (!account.loading) void load();
  }, [account.loading, load, t]);

  const openTasks = tasks.filter((task) => task.status === "open");
  const activeDeckIds = new Set(decks.filter((deck) => deck.status === "active").map((deck) => deck.id));
  const dueCards = cards
    .filter(
      (card) =>
        activeDeckIds.has(card.deck_id) &&
        !card.suspended &&
        Number.isFinite(Date.parse(card.due_at)) &&
        Date.parse(card.due_at) <= Date.now()
    )
    .sort((left, right) => Date.parse(left.due_at) - Date.parse(right.due_at));

  const selectedCards = cards.filter((card) => card.deck_id === selectedDeck);
  const selected = decks.find((deck) => deck.id === selectedDeck) ?? null;

  // 1. Generate QuizGecko Bundle
  async function handleGenerateBundle() {
    setGenerating(true);
    setError("");
    setNotice("");

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
        supabaseClient: supabase,
      });

      setActiveBundle(bundle);
      setNotice(
        t(
          `تم توليد الحزمة الذكية بنجاح! تتضمن ${bundle.questions.length} أسئلة و${bundle.cards.length} بطاقات استرجاع تباعدي.`,
          `Smart bundle generated successfully! Contains ${bundle.questions.length} questions and ${bundle.cards.length} flashcards.`
        )
      );
    } catch {
      setError(t("تعذّر التوليد الذكي. حاول مجددًا.", "Could not generate assessment. Try again."));
    } finally {
      setGenerating(false);
    }
  }

  // 2. Save Generated Cards to Supabase Deck
  async function saveBundleToDecks(bundle: QuizGeckoBundle) {
    const user = account.user;
    if (!user || busy) return;
    setBusy(true);
    setError("");

    try {
      // Create deck
      const deckResult = await supabase
        .from("flashcard_decks")
        .insert({
          user_id: user.id,
          title: bundle.title || t("حزمة مراجعة ذكية", "Smart Study Deck"),
          description: bundle.summary || t("مولدة بواسطة Noäta QuizGecko Engine", "Generated via Noäta QuizGecko Engine"),
          status: "active",
          source_type: "ai_draft",
          lesson_id: linkedLesson?.id ?? null,
        })
        .select("id")
        .single();

      if (deckResult.error || !deckResult.data) {
        throw new Error(deckResult.error?.message || "Failed to create deck");
      }

      const newDeckId = deckResult.data.id;

      // Insert cards
      const cardsToInsert = bundle.cards.map((c, i) => ({
        deck_id: newDeckId,
        user_id: user.id,
        front: c.front,
        back: c.back + (c.hint ? `\n\n💡 ${c.hint}` : ""),
        position: i + 1,
      }));

      const cardsResult = await supabase.from("flashcards").insert(cardsToInsert);
      if (cardsResult.error) throw cardsResult.error;

      setNotice(
        t(
          "تم حفظ حزمة البطاقات بالكامل في مجموعاتك بنجاح!",
          "Study deck and all flashcards saved to your account successfully!"
        )
      );
      setSelectedDeck(newDeckId);
      await load();
      setView("decks");
    } catch (err: any) {
      setError(t("تعذّر حفظ البطاقات في الحساب.", "Could not save cards to account: ") + String(err?.message ?? ""));
    } finally {
      setBusy(false);
    }
  }

  // 3. Export to Anki
  function handleExportAnki(bundleCards: QuizFlashcard[]) {
    const tsv = exportToAnkiTSV(bundleCards);
    const blob = new Blob([tsv], { type: "text/tab-separated-values;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `noata-deck-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // 4. SM-2 Card Review via Supabase RPC
  async function reviewCard(cardId: string, rating: 0 | 1 | 2 | 3) {
    if (!account.user || busy) return;
    setBusy(true);
    setError("");

    const fingerprint = `${cardId}:${rating}`;
    if (!reviewKeys.current.has(fingerprint)) reviewKeys.current.set(fingerprint, crypto.randomUUID());

    const result = await supabase.rpc("review_flashcard", {
      p_card_id: cardId,
      p_rating: rating,
      p_idempotency_key: reviewKeys.current.get(fingerprint)!,
    });

    if (result.error) {
      setError(t("لم يتأكد حفظ المراجعة. أعد نفس التقييم للتحقق دون تكراره.", "The review was not confirmed. Retry safely."));
    } else {
      const receipt = result.data as ReviewReceipt;
      if (receipt.card_id === cardId && receipt.due_at) {
        reviewKeys.current.delete(fingerprint);
        await load();
      }
    }
    setBusy(false);
  }

  // 5. Tasks handlers
  async function createTask(event: FormEvent) {
    event.preventDefault();
    if (!account.user || !taskTitle.trim() || busy) return;
    const dueAt = taskDue ? new Date(taskDue) : null;
    if (dueAt && Number.isNaN(dueAt.getTime())) {
      setError(t("موعد المهمة غير صالح.", "The task due date is invalid."));
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const result = await supabase
      .from("study_tasks")
      .insert({
        user_id: account.user.id,
        title: taskTitle.trim(),
        due_at: dueAt?.toISOString() ?? null,
        priority: taskPriority,
        source: "personal",
        task_type: linkedLesson ? "lesson" : "study",
        lesson_id: linkedLesson?.id ?? null,
      })
      .select("id")
      .single();

    if (result.error) setError(t("تعذّر حفظ المهمة.", "Could not save the task."));
    else {
      setTaskTitle("");
      setTaskDue("");
      setTaskPriority("normal");
      setNotice(t("تم حفظ المهمة.", "Task saved."));
      await load();
    }
    setBusy(false);
  }

  async function setTaskState(task: StudyTask, completed: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    const result = await supabase
      .from("study_tasks")
      .update({
        status: completed ? "completed" : "open",
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", task.id)
      .select("id,status,completed_at")
      .single();
    if (result.error) setError(t("تعذّر تحديث المهمة.", "Could not update the task."));
    else await load();
    setBusy(false);
  }

  async function removeTask(task: StudyTask) {
    if (busy || !window.confirm(t("حذف هذه المهمة؟", "Delete this task?"))) return;
    setBusy(true);
    const result = await supabase.from("study_tasks").delete().eq("id", task.id).select("id").single();
    if (result.error) setError(t("تعذّر حذف المهمة.", "Could not delete the task."));
    else await load();
    setBusy(false);
  }

  // 6. Manual Deck / Card Handlers
  async function createDeck(event: FormEvent) {
    event.preventDefault();
    if (!account.user || !deckTitle.trim() || busy) return;
    setBusy(true);
    setError("");
    const result = await supabase
      .from("flashcard_decks")
      .insert({
        user_id: account.user.id,
        title: deckTitle.trim(),
        status: "active",
        source_type: linkedLesson ? "lesson" : "manual",
        lesson_id: linkedLesson?.id ?? null,
      })
      .select("id")
      .single();
    if (result.error) setError(t("تعذّر إنشاء مجموعة البطاقات.", "Could not create the deck."));
    else {
      setDeckTitle("");
      setSelectedDeck(result.data.id);
      setNotice(t("تم إنشاء المجموعة.", "Deck created."));
      await load();
    }
    setBusy(false);
  }

  async function addCard(event: FormEvent) {
    event.preventDefault();
    if (!account.user || !selectedDeck || !front.trim() || !back.trim() || busy) return;
    setBusy(true);
    setError("");
    const result = await supabase
      .from("flashcards")
      .insert({
        deck_id: selectedDeck,
        user_id: account.user.id,
        front: front.trim(),
        back: back.trim(),
        position: Math.max(0, ...selectedCards.map((card) => card.position)) + 1,
      })
      .select("id")
      .single();
    if (result.error) setError(t("تعذّر حفظ البطاقة.", "Could not save the card."));
    else {
      setFront("");
      setBack("");
      setNotice(t("تم حفظ البطاقة.", "Card saved."));
      await load();
    }
    setBusy(false);
  }

  async function setDeckStatus(deck: Deck, status: "active" | "archived") {
    if (busy) return;
    setBusy(true);
    const result = await supabase
      .from("flashcard_decks")
      .update({ status })
      .eq("id", deck.id)
      .select("id,status")
      .single();
    if (result.error) setError(t("تعذّر تحديث المجموعة.", "Could not update the deck."));
    else await load();
    setBusy(false);
  }

  async function removeDeck(deck: Deck) {
    if (busy || !window.confirm(t("حذف المجموعة وكل بطاقاتها؟", "Delete this deck and all its cards?"))) return;
    setBusy(true);
    const result = await supabase.from("flashcard_decks").delete().eq("id", deck.id).select("id").single();
    if (result.error) setError(t("تعذّر حذف المجموعة.", "Could not delete the deck."));
    else {
      setSelectedDeck(null);
      await load();
    }
    setBusy(false);
  }

  if (account.loading || loading) {
    return (
      <section className="aura-loading-state" role="status">
        <span />
        <h2>{t("بنجهّز خطة مذاكرتك الذكية…", "Loading your smart study workspace…")}</h2>
      </section>
    );
  }

  if (account.error) {
    return (
      <section className="aura-load-error" role="alert">
        <h2>{account.error}</h2>
        <button type="button" onClick={() => void account.refresh()}>
          {t("إعادة المحاولة", "Try again")}
        </button>
      </section>
    );
  }

  if (!account.user) {
    return (
      <ModuleWelcome
        title={t("نظام الاستذكار الفائق: اختبارات وبطاقات ذكية.", "QuizGecko-Grade Assessment & Spaced Study.")}
        description={t(
          "ولّد اختبارات تفاعلية وبطاقات استرجاع نشط من أي نص أو درس، مع تكرار متباعد احترافي.",
          "Generate interactive quizzes and active-recall flashcards from any text or lesson with SM-2 spaced repetition."
        )}
        icon="review"
        route="/study"
        eyebrow={t("مركز المذاكرة والتقييم الذكي", "Smart Study & Assessment Center")}
        steps={[
          t("ولّد اختبارك الذكي وبطاقاتك", "Generate Quiz & Cards"),
          t("تدرّب مع التلميحات وتفكيك الأخطاء", "Practice with Socratic Hints"),
          t("رسّخ الحفظ بالتكرار المتباعد 3D", "Cement with 3D Spaced Review"),
        ]}
      />
    );
  }

  return (
    <>
      {/* 1. Header Hero */}
      <header className="noata-study-hero">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="noata-eyebrow">{t("بيئة الاستذكار الفائق (QuizGecko-Grade)", "Universal AI Learning Engine")}</p>
            <h1>{t("مركز المذاكرة والتقييم التفاعلي", "Interactive Study & Assessment Center")}</h1>
            <p style={{ margin: 0, color: "var(--muted)", maxWidth: 640, fontSize: 14, lineHeight: 1.7 }}>
              {t(
                "حوّل أي درس أو نص إلى اختبارات تشخيصية تفاعلية وبطاقات تكرار متباعد 3D مع تفكيك المفاهيم الخاطئة وتلميحات سقراطية.",
                "Transform any lesson or text into interactive diagnostic quizzes and 3D spaced flashcards with misconception breakdowns and Socratic hints."
              )}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontSize: 13, padding: "8px 16px" }}>
              ⚡ {dueCards.length} {t("بطاقات مستحقة للمراجعة", "cards due for review")}
            </span>
            <span className="pill" style={{ background: "var(--surface-soft)", fontSize: 13, padding: "8px 16px" }}>
              📋 {openTasks.length} {t("مهام مفتوحة", "open tasks")}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Top Navigation Tabs */}
      <nav className="noata-study-tabs" aria-label={t("أقسام مركز المذاكرة", "Study Center Tabs")}>
        <button
          type="button"
          className="noata-study-tab-btn"
          aria-selected={view === "generator"}
          onClick={() => setView("generator")}
        >
          <Icon name="sparkles" size={16} />
          <span>{t("⚡ مولّد كويزجيكو الذكي", "⚡ AI Quiz & Card Generator")}</span>
        </button>

        <button
          type="button"
          className="noata-study-tab-btn"
          aria-selected={view === "quiz"}
          onClick={() => setView("quiz")}
        >
          <Icon name="check" size={16} />
          <span>{t("🎯 استوديو الاختبارات", "🎯 Interactive Quiz Studio")}</span>
        </button>

        <button
          type="button"
          className="noata-study-tab-btn"
          aria-selected={view === "review"}
          onClick={() => setView("review")}
        >
          <Icon name="review" size={16} />
          <span>
            {t("🧠 مراجعة تباعدية 3D", "🧠 3D Spaced Review")}
            {dueCards.length > 0 && <span className="pill" style={{ marginInlineStart: 6, padding: "2px 6px", fontSize: 11, background: "var(--accent)", color: "#fff" }}>{dueCards.length}</span>}
          </span>
        </button>

        <button
          type="button"
          className="noata-study-tab-btn"
          aria-selected={view === "decks"}
          onClick={() => setView("decks")}
        >
          <Icon name="book" size={16} />
          <span>{t("📚 مجموعات البطاقات", "📚 Flashcard Decks")}</span>
        </button>

        <button
          type="button"
          className="noata-study-tab-btn"
          aria-selected={view === "tasks"}
          onClick={() => setView("tasks")}
        >
          <Icon name="settings" size={16} />
          <span>{t("📋 جدول ومهام المذاكرة", "📋 Study Tasks")}</span>
        </button>
      </nav>

      {/* Error & Notice banners */}
      {(error || notice) && (
        <div
          className={error ? "aura-load-error" : "panel"}
          role={error ? "alert" : "status"}
          style={{ marginBottom: 20 }}
        >
          <p style={{ margin: 0 }}>{error || notice}</p>
          {error && (
            <button type="button" onClick={() => void load()}>
              {t("إعادة المحاولة", "Try again")}
            </button>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 1: AI GENERATOR (QUIZGECKO GRADE)
          ============================================================ */}
      {view === "generator" && (
        <section className="noata-generator-panel">
          <div className="noata-generator-header">
            <span className="noata-generator-icon">⚡</span>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>
                {t("مولّد الاختبارات والبطاقات الذكي الشامل", "Universal AI Quiz & Flashcard Generator")}
              </h2>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                {t(
                  "تقنية مستوحاة من QuizGecko: توليد فوري للأسئلة متعددة الخيارات (MCQ)، صح/خطأ، والبطاقات التباعدية من أي مدخل.",
                  "QuizGecko-grade generation: MCQs with distractor explanations, True/False, and SM-2 flashcards from anything."
                )}
              </p>
            </div>
          </div>

          {/* Source Selector */}
          <div className="noata-source-selector">
            <button
              type="button"
              className="noata-source-card"
              aria-checked={genSource === "topic"}
              onClick={() => setGenSource("topic")}
            >
              <span style={{ fontSize: 22 }}>💡</span>
              <h3>{t("موضوع أو مفهوم دراسي", "Topic or Concept")}</h3>
              <p>{t("اكتب أي موضوع أو فكرة علمية لتحليلها فوراً.", "Enter any subject concept for instant pedagogical synthesis.")}</p>
            </button>

            <button
              type="button"
              className="noata-source-card"
              aria-checked={genSource === "lesson"}
              onClick={() => setGenSource("lesson")}
            >
              <span style={{ fontSize: 22 }}>📖</span>
              <h3>{t("درس من المنهج التعليمي", "Curriculum Lesson")}</h3>
              <p>{t(linkedLesson ? `متصل بـ: ${linkedLesson.title}` : "اختر درساً معتمداً من مساراتك الدراسية.", linkedLesson ? `Connected: ${linkedLesson.title}` : "Select from your enrolled curriculum tracks.")}</p>
            </button>

            <button
              type="button"
              className="noata-source-card"
              aria-checked={genSource === "text"}
              onClick={() => setGenSource("text")}
            >
              <span style={{ fontSize: 22 }}>📄</span>
              <h3>{t("لصق نص أو ملخص مذاكرة", "Paste Notes / Text")}</h3>
              <p>{t("الصق أي فقرة أو ملخص لتوليد الأسئلة منها.", "Paste textbook excerpts, lecture notes, or articles.")}</p>
            </button>
          </div>

          {/* Input Fields */}
          {genSource === "topic" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
                {t("اسم الموضوع أو الفكرة:", "Topic / Concept Name:")}
              </label>
              <input
                className="search"
                style={{ width: "100%", padding: "14px 16px", borderRadius: 14 }}
                placeholder={t("مثل: التنفس الخلوي، قوانين نيوتن، علم البديع، التفاضل والتكامل...", "e.g., Photosynthesis, Newton's Laws, Arabic Rhetoric, Calculus...")}
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
              />
            </div>
          )}

          {genSource === "lesson" && (
            <div style={{ marginBottom: 16, padding: 18, borderRadius: 16, background: "var(--surface-soft)", border: "1px solid var(--line)" }}>
              {linkedLesson ? (
                <div>
                  <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)", marginBottom: 6 }}>
                    {t("درس متصل من المنهج", "Connected Curriculum Lesson")}
                  </span>
                  <h3 style={{ margin: "6px 0 4px", fontSize: 17, fontWeight: 800 }}>{linkedLesson.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                    {t("سيتم توليد الأسئلة والبطاقات بناءً على أهداف وشرح هذا الدرس المعتمد.", "Quizzes and cards will be generated directly from this lesson's core objectives.")}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: "0 0 10px", fontSize: 13.5, color: "var(--ink)" }}>
                    {t("افتح أي درس من صفحة المناهج ثم اضغط «توليد كويز وبطاقات QuizGecko»، أو اكتب اسم الموضوع مباشرة بالأعلى.", "Open any lesson from Curriculum and choose 'Generate QuizGecko Deck', or enter a topic above.")}
                  </p>
                  <Link href="/curriculum" className="btn btn-secondary" style={{ fontSize: 12 }}>
                    {t("تصفح مسارات المناهج والدروس ←", "Browse Curriculum Tracks →")}
                  </Link>
                </div>
              )}
            </div>
          )}

          {genSource === "text" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
                {t("الصق النص أو المحتوى التعليمي هنا:", "Paste Educational Text / Notes:")}
              </label>
              <textarea
                className="noata-gen-textarea"
                rows={5}
                placeholder={t("الصق ملخص المحاضرة، فقرة من الكتاب، أو نقاط المذاكرة...", "Paste notes, summaries, or articles here...")}
                value={genText}
                onChange={(e) => setGenText(e.target.value)}
              />
            </div>
          )}

          {/* Controls row */}
          <div className="noata-controls-row">
            <div className="noata-controls-group">
              <label>{t("مستوى الصعوبة", "Difficulty")}</label>
              <select
                className="noata-select"
                value={genDifficulty}
                onChange={(e) => setGenDifficulty(e.target.value as QuizDifficulty)}
              >
                <option value="easy">{t("مبتدئ / تأسيسي", "Beginner / Foundational")}</option>
                <option value="medium">{t("متوسط / تطبيقي", "Intermediate / Applied")}</option>
                <option value="hard">{t("متقدم / تحدي عميق", "Advanced / Mastery")}</option>
              </select>
            </div>

            <div className="noata-controls-group">
              <label>{t("عدد الأسئلة", "Questions Count")}</label>
              <select
                className="noata-select"
                value={genQuestionCount}
                onChange={(e) => setGenQuestionCount(Number(e.target.value))}
              >
                <option value={3}>3 {t("أسئلة سريعة", "Quick Questions")}</option>
                <option value={5}>5 {t("أسئلة متوازنة", "Balanced (5 Qs)")}</option>
                <option value={8}>8 {t("أسئلة شاملة", "Comprehensive (8 Qs)")}</option>
                <option value={10}>10 {t("اختبار كامل", "Full Exam (10 Qs)")}</option>
              </select>
            </div>

            <div className="noata-controls-group">
              <label>{t("عدد بطاقات التكرار", "Flashcards Count")}</label>
              <select
                className="noata-select"
                value={genCardCount}
                onChange={(e) => setGenCardCount(Number(e.target.value))}
              >
                <option value={4}>4 {t("بطاقات محورية", "Key Cards")}</option>
                <option value={6}>6 {t("بطاقات استرجاع", "Recall Cards")}</option>
                <option value={10}>10 {t("مجموعة كاملة", "Full Deck (10)")}</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: "100%", minHeight: 52, fontSize: 16, fontWeight: 800 }}
            disabled={generating || (genSource === "topic" && !genTopic.trim()) || (genSource === "text" && !genText.trim())}
            onClick={() => void handleGenerateBundle()}
          >
            <Icon name="sparkles" size={18} />
            <span>
              {generating
                ? t("جارٍ التحليل والتوليد الذكي...", "Analyzing & Generating QuizGecko Bundle…")
                : t("⚡ توليد الاختبار والبطاقات الذكية فوراً", "⚡ Generate Smart Quiz & Flashcards Now")}
            </span>
          </button>

          {/* Generated Bundle Preview */}
          {activeBundle && (
            <div style={{ marginTop: 32, paddingTop: 28, borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div>
                  <span className="pill" style={{ background: "color-mix(in srgb, #10b981 15%, var(--surface))", color: "#10b981" }}>
                    ✓ {t("الحزمة جاهزة للاستخدام", "Bundle Ready")}
                  </span>
                  <h3 style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 900 }}>{activeBundle.title}</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>{activeBundle.summary}</p>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setView("quiz")}
                  >
                    <Icon name="check" size={16} />
                    <span>{t("🎯 ابدأ الاختبار فوراً", "Take Quiz Now")}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => void saveBundleToDecks(activeBundle)}
                    disabled={busy}
                  >
                    <Icon name="book" size={16} />
                    <span>{t("💾 حفظ في مجموعاتي الدائمة", "Save to My Decks")}</span>
                  </button>

                  <button
                    type="button"
                    className="btn"
                    onClick={() => handleExportAnki(activeBundle.cards)}
                  >
                    <span>📥 {t("تصدير إلى Anki (TSV)", "Export to Anki")}</span>
                  </button>
                </div>
              </div>

              {/* Key takeaways */}
              {activeBundle.keyTakeaways.length > 0 && (
                <div style={{ padding: 16, borderRadius: 16, background: "var(--surface-soft)", border: "1px solid var(--line)", marginBottom: 20 }}>
                  <strong style={{ fontSize: 13, display: "block", marginBottom: 8, color: "var(--ink)" }}>
                    💡 {t("المفاهيم المحورية المستخلصة:", "Key Conceptual Takeaways:")}
                  </strong>
                  <ul style={{ margin: 0, paddingInlineStart: 20, fontSize: 13, color: "var(--muted)", lineHeight: 1.8 }}>
                    {activeBundle.keyTakeaways.map((point, idx) => (
                      <li key={idx}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          TAB 2: INTERACTIVE QUIZ RUNNER (QUIZGECKO GRADE)
          ============================================================ */}
      {view === "quiz" && (
        <section>
          {activeBundle ? (
            <InteractiveQuizRunner
              bundle={activeBundle}
              onFinish={(score, missedCards) => {
                // If student missed questions, prompt to save as remedial deck
                if (missedCards.length > 0 && account.user) {
                  // Save remedial flashcards to database
                  void supabase.from("flashcard_decks").insert({
                    user_id: account.user.id,
                    title: t(`بطاقات معالجة أخطاء: ${activeBundle.title}`, `Remedial Cards: ${activeBundle.title}`),
                    description: t("بطاقات مستخرجة من الأسئلة غير الصحيحة لترسيخ المفاهيم المفقودة.", "Auto-generated cards from missed quiz questions."),
                    status: "active",
                    source_type: "ai_draft",
                  }).select("id").single().then((res) => {
                    if (res.data) {
                      const toInsert = missedCards.map((c, i) => ({
                        deck_id: res.data.id,
                        user_id: account.user!.id,
                        front: c.front,
                        back: c.back,
                        position: i + 1,
                      }));
                      void supabase.from("flashcards").insert(toInsert).then(() => void load());
                    }
                  });
                }
              }}
              onRestart={() => setView("generator")}
            />
          ) : (
            <div className="noata-quiz-card" style={{ textAlign: "center", padding: 44 }}>
              <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>🎯</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>
                {t("لا يوجد اختبار نشط حالياً", "No Active Quiz Session")}
              </h2>
              <p style={{ color: "var(--muted)", maxWidth: 480, margin: "0 auto 20px", fontSize: 13.5 }}>
                {t(
                  "اختر درساً أو موضوعاً من تبويب «مولّد كويزجيكو الذكي» بالأعلى لتوليد اختبار تشخيصي مخصص فوراً.",
                  "Generate a customized diagnostic quiz from the AI Generator tab above to begin testing."
                )}
              </p>
              <button type="button" className="btn btn-primary" onClick={() => setView("generator")}>
                <Icon name="sparkles" size={16} />
                <span>{t("فتح مولّد الاختبارات الذكي", "Open AI Quiz Generator")}</span>
              </button>
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          TAB 3: 3D SPACED REPETITION REVIEW STUDIO (ANKI / SM-2)
          ============================================================ */}
      {view === "review" && (
        <section>
          {dueCards.length > 0 ? (
            <FlashcardReviewStudio
              deckTitle={decks.find((d) => d.id === dueCards[0]?.deck_id)?.title}
              cards={dueCards.map((c) => ({
                id: c.id,
                front: c.front,
                back: c.back,
                concept: decks.find((d) => d.id === c.deck_id)?.title,
              }))}
              onRateCard={(cardId, rating) => void reviewCard(cardId, rating)}
              onFinish={() => void load()}
              busy={busy}
            />
          ) : activeBundle && activeBundle.cards.length > 0 ? (
            <div>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span className="pill" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                  {t("مراجعة بطاقات الحزمة المولدة حديثاً", "Reviewing Newly Generated Bundle Cards")}
                </span>
              </div>
              <FlashcardReviewStudio
                deckTitle={activeBundle.title}
                cards={activeBundle.cards}
                onRateCard={async (_id, _rating) => {
                  // Local review for generated bundle
                }}
                onFinish={() => {
                  alert(t("أحسنت! أكملت مراجعة جميع بطاقات هذه الحزمة.", "Great job! You finished reviewing this bundle."));
                }}
              />
            </div>
          ) : (
            <div className="noata-quiz-card" style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", padding: 44 }}>
              <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>🧠</span>
              <h2 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>
                {t("لا توجد بطاقات مستحقة للمراجعة الآن", "No Cards Due for Review Right Now")}
              </h2>
              <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto 20px", fontSize: 13.5 }}>
                {t(
                  "فواصل التكرار المتباعد تحسب بدقة متى يجب استدعاء كل بطاقة. يمكنك توليد بطاقات جديدة أو مراجعة مجموعاتك يدوياً.",
                  "Spaced repetition algorithms schedule optimal recall intervals. Generate new cards or practice your decks anytime."
                )}
              </p>
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <button type="button" className="btn btn-primary" onClick={() => setView("generator")}>
                  <span>{t("توليد بطاقات جديدة", "Generate New Cards")}</span>
                </button>
                <button type="button" className="btn" onClick={() => setView("decks")}>
                  <span>{t("عرض مجموعاتك", "View Decks")}</span>
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ============================================================
          TAB 4: FLASHCARD DECKS & CARDS MANAGEMENT
          ============================================================ */}
      {view === "decks" && (
        <section className="content-grid">
          <div style={{ display: "grid", gap: 16 }}>
            {/* Create new deck form */}
            <form className="panel" onSubmit={createDeck}>
              <div className="panel-head">
                <h2>{t("مجموعة بطاقات جديدة", "New Flashcard Deck")}</h2>
              </div>
              <input
                className="search"
                style={{ width: "100%" }}
                maxLength={160}
                value={deckTitle}
                onChange={(e) => setDeckTitle(e.target.value)}
                placeholder={t("مثل: مصطلحات الغلاف المائي، معادلات الكيمياء...", "e.g., Hydrosphere terms, Chemistry formulas...")}
              />
              <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={busy || !deckTitle.trim()}>
                {t("إنشاء المجموعة", "Create Deck")}
              </button>
            </form>

            {/* Decks list */}
            <div className="panel">
              <div className="panel-head">
                <h2>{t("مجموعاتك الدائمة", "Your Decks")}</h2>
                <span className="pill">{decks.length}</span>
              </div>
              <div className="quest-list">
                {decks.map((deck) => {
                  const deckCardCount = cards.filter((c) => c.deck_id === deck.id).length;
                  return (
                    <button
                      type="button"
                      key={deck.id}
                      className="quest"
                      aria-pressed={selectedDeck === deck.id}
                      onClick={() => setSelectedDeck(deck.id)}
                      style={{ width: "100%", textAlign: "start" }}
                    >
                      <div className="quest-icon">{deckCardCount}</div>
                      <div>
                        <h3>{deck.title}</h3>
                        <p>
                          {deck.source_type === "ai_draft"
                            ? t("مولدة بالذكاء الاصطناعي", "AI Generated")
                            : t("مجموعة يدوية", "Personal Deck")}{" "}
                          · {deck.status === "active" ? t("نشطة", "Active") : t("مؤرشفة", "Archived")}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {!decks.length && (
                  <p>{t("لا توجد مجموعات بعد. ولّد مجموعة بالذكاء الاصطناعي أو أنشئ واحدة يدوياً.", "No decks yet. Generate with AI or create manually.")}</p>
                )}
              </div>
            </div>
          </div>

          {/* Selected Deck Details & Cards */}
          <div className="panel">
            <div className="panel-head">
              <h2>{selected?.title ?? t("اختر مجموعة", "Select a deck")}</h2>
              {selected && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn"
                    disabled={busy}
                    onClick={() => void setDeckStatus(selected, selected.status === "active" ? "archived" : "active")}
                  >
                    {selected.status === "active" ? t("أرشفة", "Archive") : t("تفعيل للمراجعة", "Activate")}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      const tsvCards: QuizFlashcard[] = selectedCards.map((c) => ({
                        id: c.id,
                        front: c.front,
                        back: c.back,
                        hint: "",
                        concept: selected.title,
                      }));
                      handleExportAnki(tsvCards);
                    }}
                  >
                    <span>📥 {t("Anki", "Anki")}</span>
                  </button>
                  <button type="button" className="btn" disabled={busy} onClick={() => void removeDeck(selected)}>
                    {t("حذف", "Delete")}
                  </button>
                </div>
              )}
            </div>

            {selected && (
              <>
                {/* Add Card Form */}
                <form onSubmit={addCard} style={{ display: "grid", gap: 10 }}>
                  <textarea
                    className="search"
                    rows={2}
                    maxLength={2000}
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    placeholder={t("السؤال أو المصطلح الأساسي (الوجه)", "Front: Question or term")}
                  />
                  <textarea
                    className="search"
                    rows={3}
                    maxLength={4000}
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    placeholder={t("الإجابة أو التفسير المفاهيمي (الظهر)", "Back: Answer or definition")}
                  />
                  <button className="btn btn-primary" disabled={busy || !front.trim() || !back.trim()}>
                    {t("إضافة بطاقة إلى هذه المجموعة", "Add Card to Deck")}
                  </button>
                </form>

                {/* Cards List */}
                <ol className="quest-list" style={{ marginTop: 16 }}>
                  {selectedCards.map((card) => (
                    <li className="quest" key={card.id}>
                      <div className="quest-icon">{card.position}</div>
                      {editingCard === card.id ? (
                        <div style={{ display: "grid", gap: 8, width: "100%" }}>
                          <textarea
                            className="search"
                            rows={2}
                            maxLength={2000}
                            value={editFront}
                            onChange={(e) => setEditFront(e.target.value)}
                          />
                          <textarea
                            className="search"
                            rows={3}
                            maxLength={4000}
                            value={editBack}
                            onChange={(e) => setEditBack(e.target.value)}
                          />
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy || !editFront.trim() || !editBack.trim()}
                              onClick={async () => {
                                setBusy(true);
                                await supabase
                                  .from("flashcards")
                                  .update({ front: editFront.trim(), back: editBack.trim() })
                                  .eq("id", card.id);
                                setEditingCard(null);
                                await load();
                                setBusy(false);
                              }}
                            >
                              {t("حفظ", "Save")}
                            </button>
                            <button type="button" className="btn" onClick={() => setEditingCard(null)}>
                              {t("إلغاء", "Cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ flex: 1 }}>
                          <h3 dir="auto">{card.front}</h3>
                          <p dir="auto">{card.back}</p>
                        </div>
                      )}

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span className="pill">{card.state}</span>
                        {editingCard !== card.id && (
                          <>
                            <button
                              type="button"
                              className="btn"
                              disabled={busy}
                              onClick={() => {
                                setEditingCard(card.id);
                                setEditFront(card.front);
                                setEditBack(card.back);
                              }}
                            >
                              {t("تعديل", "Edit")}
                            </button>
                            <button
                              type="button"
                              className="btn"
                              disabled={busy}
                              onClick={async () => {
                                if (!window.confirm(t("حذف هذه البطاقة؟", "Delete this card?"))) return;
                                setBusy(true);
                                await supabase.from("flashcards").delete().eq("id", card.id);
                                await load();
                                setBusy(false);
                              }}
                            >
                              {t("حذف", "Delete")}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  ))}
                  {!selectedCards.length && (
                    <p style={{ color: "var(--muted)" }}>{t("المجموعة فارغة حالياً. أضف بطاقتك الأولى بالأعلى.", "Deck is currently empty. Add your first card above.")}</p>
                  )}
                </ol>
              </>
            )}
          </div>
        </section>
      )}

      {/* ============================================================
          TAB 5: STUDY TASKS & PLANNER
          ============================================================ */}
      {view === "tasks" && (
        <section className="content-grid">
          <form className="panel" onSubmit={createTask}>
            <div className="panel-head">
              <h2>{t("مهمة مذاكرة شخصية جديدة", "New Personal Study Task")}</h2>
              <span className="pill">{t("خطة خاصة", "Personal Plan")}</span>
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <small>{t("عنوان المهمة", "Task title")}</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  maxLength={160}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </label>
              <label>
                <small>{t("موعد اختياري", "Optional due date")}</small>
                <input
                  className="search"
                  style={{ width: "100%", marginTop: 6 }}
                  type="datetime-local"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                />
              </label>
              <label>
                <small>{t("الأولوية", "Priority")}</small>
                <select
                  className="model-select"
                  style={{ width: "100%", marginTop: 6 }}
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option value="low">{t("منخفضة", "Low")}</option>
                  <option value="normal">{t("عادية", "Normal")}</option>
                  <option value="high">{t("عالية", "High")}</option>
                </select>
              </label>
              <button className="btn btn-primary" disabled={busy || !taskTitle.trim()}>
                {t("حفظ المهمة", "Save task")}
              </button>
            </div>
          </form>

          <div className="panel">
            <div className="panel-head">
              <h2>{t("مهامك المجدولة", "Your Scheduled Tasks")}</h2>
              <span className="pill">{tasks.length}</span>
            </div>
            <div className="quest-list">
              {tasks.map((task) => (
                <article className="quest" key={task.id}>
                  <div className="quest-icon">
                    {task.status === "completed" ? "✓" : task.priority === "high" ? "!" : "•"}
                  </div>
                  <div>
                    <h3 style={{ textDecoration: task.status === "completed" ? "line-through" : "none" }}>
                      {task.title}
                    </h3>
                    <p>
                      {task.due_at
                        ? new Date(task.due_at).toLocaleString(locale === "en" ? "en" : "ar-EG")
                        : t("بدون موعد محدد", "No due date")}
                      {task.recommendation_reason ? ` · ${task.recommendation_reason}` : ""}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => void setTaskState(task, task.status !== "completed")}
                    >
                      {task.status === "completed" ? t("إعادة فتح", "Reopen") : t("إكمال", "Complete")}
                    </button>
                    <button type="button" className="btn" disabled={busy} onClick={() => void removeTask(task)}>
                      {t("حذف", "Delete")}
                    </button>
                  </div>
                </article>
              ))}
              {!tasks.length && (
                <p>{t("لم تنشئ مهام شخصية بعد. نظّم خطتك الدراسية من النموذج بالأعلى.", "No personal tasks yet. Organize your study schedule above.")}</p>
              )}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
