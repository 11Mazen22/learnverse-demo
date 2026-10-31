"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ModuleWelcome } from "@/components/ui/module-welcome";
import { useLocale, useTranslation } from "@/lib/i18n/locale";
import { createClient } from "@/lib/supabase/client";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";

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
  const supabase = useMemo(() => createClient(), []);
  const account = useVerifiedAccount();
  const [view, setView] = useState<"tasks" | "decks" | "review">("tasks");
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("normal");
  const [linkedLesson, setLinkedLesson] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const reviewKeys = useRef(new Map<string, string>());

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
          "The study workspace is not available in this environment yet. No tasks or cards were assumed or saved.",
        ),
      );
    } else {
      setTasks((taskResult.data ?? []) as StudyTask[]);
      setDecks((deckResult.data ?? []) as Deck[]);
      setCards((cardResult.data ?? []) as Card[]);
      setSelectedDeck((current) =>
        current && (deckResult.data ?? []).some((deck) => deck.id === current)
          ? current
          : deckResult.data?.[0]?.id ?? null,
      );
    }
    setLoading(false);
  }, [account.revision, account.user, supabase, t]);

  useEffect(() => {
    const parameters = new URLSearchParams(window.location.search);
    const lesson = parameters.get("lesson");
    const title = parameters.get("title")?.trim();
    setLinkedLesson(lesson || null);
    if (lesson && title) {
      setTaskTitle((current) => current || t(`مذاكرة: ${title}`, `Study: ${title}`));
      setDeckTitle((current) => current || title.slice(0, 160));
    }
    reviewKeys.current.clear();
    setSelectedDeck(null);
    setNotice("");
    if (!account.loading) void load();
  }, [account.loading, account.user, load]);

  const openTasks = tasks.filter((task) => task.status === "open");
  const activeDeckIds = new Set(decks.filter((deck) => deck.status === "active").map((deck) => deck.id));
  const dueCards = cards
    .filter(
      (card) =>
        activeDeckIds.has(card.deck_id) &&
        !card.suspended &&
        Number.isFinite(Date.parse(card.due_at)) &&
        Date.parse(card.due_at) <= Date.now(),
    )
    .sort((left, right) => Date.parse(left.due_at) - Date.parse(right.due_at));
  const dueCard = dueCards[0] ?? null;
  const selectedCards = cards.filter((card) => card.deck_id === selectedDeck);
  const selected = decks.find((deck) => deck.id === selectedDeck) ?? null;

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
        lesson_id: linkedLesson,
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
        lesson_id: linkedLesson,
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

  function beginCardEdit(card: Card) {
    setEditingCard(card.id);
    setEditFront(card.front);
    setEditBack(card.back);
  }

  async function saveCard(card: Card) {
    if (busy || !editFront.trim() || !editBack.trim()) return;
    setBusy(true);
    const result = await supabase
      .from("flashcards")
      .update({ front: editFront.trim(), back: editBack.trim() })
      .eq("id", card.id)
      .select("id,front,back")
      .single();
    if (result.error) setError(t("تعذّر حفظ تعديل البطاقة.", "Could not save the card edit."));
    else {
      setEditingCard(null);
      await load();
    }
    setBusy(false);
  }

  async function removeCard(card: Card) {
    if (busy || !window.confirm(t("حذف هذه البطاقة؟", "Delete this card?"))) return;
    setBusy(true);
    const result = await supabase.from("flashcards").delete().eq("id", card.id).select("id").single();
    if (result.error) setError(t("تعذّر حذف البطاقة.", "Could not delete the card."));
    else await load();
    setBusy(false);
  }

  async function review(rating: 0 | 1 | 2 | 3) {
    if (!dueCard || busy) return;
    setBusy(true);
    setError("");
    const fingerprint = `${dueCard.id}:${rating}`;
    if (!reviewKeys.current.has(fingerprint)) reviewKeys.current.set(fingerprint, crypto.randomUUID());
    const result = await supabase.rpc("review_flashcard", {
      p_card_id: dueCard.id,
      p_rating: rating,
      p_idempotency_key: reviewKeys.current.get(fingerprint)!,
    });
    if (result.error) {
      setError(t("لم يتأكد حفظ المراجعة. أعد نفس التقييم للتحقق دون تكراره.", "The review was not confirmed. Retry the same rating safely."));
    } else {
      const receipt = result.data as ReviewReceipt;
      if (receipt.card_id !== dueCard.id || !receipt.due_at) {
        setError(t("وصل رد غير مكتمل؛ لم نعرض نجاحًا غير مؤكد.", "The review receipt was incomplete."));
      } else {
        reviewKeys.current.delete(fingerprint);
        setRevealed(false);
        setNotice(
          t(
            `موعد المراجعة التالية: ${new Date(receipt.due_at).toLocaleString("ar-EG")}`,
            `Next review: ${new Date(receipt.due_at).toLocaleString("en")}`,
          ),
        );
        await load();
      }
    }
    setBusy(false);
  }

  if (account.loading || loading) {
    return <section className="aura-loading-state" role="status"><span /><h2>{t("بنجهّز خطة مذاكرتك…", "Loading your study workspace…")}</h2></section>;
  }
  if (account.error) {
    return <section className="aura-load-error" role="alert"><h2>{account.error}</h2><button type="button" onClick={() => void account.refresh()}>{t("إعادة المحاولة", "Try again")}</button></section>;
  }
  if (!account.user) {
    return <ModuleWelcome title={t("خطتك وبطاقاتك، محفوظة لحسابك.", "Your tasks and cards, saved to your account.")} description={t("أنشئ مهام مذاكرة شخصية وراجع بطاقات الاسترجاع في مواعيدها التقديرية.", "Create personal study tasks and review active-recall cards on their estimated schedule.")} icon="review" route="/study" eyebrow={t("مركز المذاكرة", "Study center")} steps={[t("خطط لمهمتك", "Plan a task"), t("أنشئ بطاقاتك", "Create cards"), t("راجع في موعدك", "Review when due")]} />;
  }

  return <>
    <header className="noata-section-head"><div><p className="noata-eyebrow">{t("خطة حقيقية، من بياناتك", "A plan grounded in your data")}</p><h1>{t("مركز المذاكرة", "Study center")}</h1><p>{t("المهام الشخصية منفصلة عن واجبات المعلّم. فواصل البطاقات تقديرية ولا تُعد دليل إتقان أو تمنح مكافآت.", "Personal tasks are separate from teacher assignments. Card intervals are estimates, not mastery proof, and grant no rewards.")}</p></div><span className="pill">{openTasks.length} {t("مهام مفتوحة", "open tasks")} · {dueCards.length} {t("بطاقات مستحقة", "cards due")}</span></header>
    <nav className="filter-bar" aria-label={t("أقسام مركز المذاكرة", "Study center sections")}>
      {([['tasks',t("مهامي", "My tasks")],['decks',t("مجموعات البطاقات", "Flashcard decks")],['review',t("مراجعة مستحقة", "Due review")]] as const).map(([key,label])=><button key={key} type="button" className="filter-chip" aria-pressed={view===key} onClick={()=>{setView(key);setRevealed(false);}}>{label}</button>)}
    </nav>
    {(error || notice) && <div className={error ? "aura-load-error" : "panel"} role={error ? "alert" : "status"} style={{marginBottom:16}}>{error || notice}{error && <button type="button" onClick={() => void load()}>{t("إعادة المحاولة", "Try again")}</button>}</div>}

    {view === "tasks" && <section className="content-grid">
      <form className="panel" onSubmit={createTask}><div className="panel-head"><h2>{t("مهمة شخصية جديدة", "New personal task")}</h2><span className="pill">{t("لا تمنح نقاطًا", "No rewards")}</span></div><div style={{display:"grid",gap:12}}><label><small>{t("عنوان المهمة", "Task title")}</small><input className="search" style={{width:"100%",marginTop:6}} maxLength={160} value={taskTitle} onChange={(event)=>setTaskTitle(event.target.value)} required /></label><label><small>{t("موعد اختياري", "Optional due date")}</small><input className="search" style={{width:"100%",marginTop:6}} type="datetime-local" value={taskDue} onChange={(event)=>setTaskDue(event.target.value)} /></label><label><small>{t("الأولوية", "Priority")}</small><select className="model-select" style={{width:"100%",marginTop:6}} value={taskPriority} onChange={(event)=>setTaskPriority(event.target.value)}><option value="low">{t("منخفضة", "Low")}</option><option value="normal">{t("عادية", "Normal")}</option><option value="high">{t("عالية", "High")}</option></select></label><button className="btn btn-primary" disabled={busy || !taskTitle.trim()}>{t("حفظ المهمة", "Save task")}</button></div></form>
      <div className="panel"><div className="panel-head"><h2>{t("مهامك", "Your tasks")}</h2><span className="pill">{tasks.length}</span></div><div className="quest-list">{tasks.map((task)=><article className="quest" key={task.id}><div className="quest-icon">{task.status === "completed" ? "✓" : task.priority === "high" ? "!" : "•"}</div><div><h3>{task.title}</h3><p>{task.due_at ? new Date(task.due_at).toLocaleString(locale === "en" ? "en" : "ar-EG") : t("بدون موعد", "No due date")}{task.recommendation_reason ? ` · ${task.recommendation_reason}` : ""}</p></div><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button type="button" className="btn" disabled={busy} onClick={()=>void setTaskState(task,task.status!=="completed")}>{task.status === "completed" ? t("إعادة فتح", "Reopen") : t("إكمال", "Complete")}</button><button type="button" className="btn" disabled={busy} onClick={()=>void removeTask(task)}>{t("حذف", "Delete")}</button></div></article>)}{!tasks.length && <p>{t("لم تنشئ مهام شخصية بعد. مواعيد الواجبات الرسمية تبقى في صفحة الواجبات.", "No personal tasks yet. Formal deadlines remain on Assignments.")}</p>}</div></div>
    </section>}

    {view === "decks" && <section className="content-grid">
      <div style={{display:"grid",gap:16}}><form className="panel" onSubmit={createDeck}><div className="panel-head"><h2>{t("مجموعة جديدة", "New deck")}</h2></div><input className="search" style={{width:"100%"}} maxLength={160} value={deckTitle} onChange={(event)=>setDeckTitle(event.target.value)} placeholder={t("مثل: تعريفات الغلاف المائي", "For example: Hydrosphere definitions")} /><button className="btn btn-primary" style={{marginTop:10}} disabled={busy || !deckTitle.trim()}>{t("إنشاء المجموعة", "Create deck")}</button></form><div className="panel"><div className="panel-head"><h2>{t("مجموعاتك", "Your decks")}</h2><span className="pill">{decks.length}</span></div><div className="quest-list">{decks.map((deck)=><button type="button" key={deck.id} className="quest" aria-pressed={selectedDeck===deck.id} onClick={()=>setSelectedDeck(deck.id)} style={{width:"100%",textAlign:"start"}}><div className="quest-icon">{cards.filter((card)=>card.deck_id===deck.id).length}</div><div><h3>{deck.title}</h3><p>{deck.source_type === "ai_draft" ? t("مسودة AI تحتاج مراجعتك", "AI draft requiring your review") : t("مجموعة شخصية", "Personal deck")} · {deck.status}</p></div></button>)}{!decks.length && <p>{t("لا توجد مجموعات بعد.", "No decks yet.")}</p>}</div></div></div>
      <div className="panel"><div className="panel-head"><h2>{selected?.title ?? t("اختر مجموعة", "Select a deck")}</h2>{selected && <div style={{display:"flex",gap:6,flexWrap:"wrap"}}><button type="button" className="btn" disabled={busy} onClick={()=>void setDeckStatus(selected,selected.status === "active" ? "archived" : "active")}>{selected.status === "active" ? t("أرشفة", "Archive") : t("تفعيل للمراجعة", "Activate for review")}</button><button type="button" className="btn" disabled={busy} onClick={()=>void removeDeck(selected)}>{t("حذف المجموعة", "Delete deck")}</button></div>}</div>{selected && <><form onSubmit={addCard} style={{display:"grid",gap:10}}><textarea className="search" rows={3} maxLength={2000} value={front} onChange={(event)=>setFront(event.target.value)} placeholder={t("السؤال أو المصطلح", "Question or term")} /><textarea className="search" rows={4} maxLength={4000} value={back} onChange={(event)=>setBack(event.target.value)} placeholder={t("الإجابة أو التعريف", "Answer or definition")} /><button className="btn btn-primary" disabled={busy || !front.trim() || !back.trim()}>{t("إضافة بطاقة", "Add card")}</button></form><ol className="quest-list" style={{marginTop:16}}>{selectedCards.map((card)=><li className="quest" key={card.id}><div className="quest-icon">{card.position}</div>{editingCard===card.id?<div style={{display:"grid",gap:8}}><textarea className="search" rows={2} maxLength={2000} value={editFront} onChange={(event)=>setEditFront(event.target.value)} aria-label={t("وجه البطاقة", "Card front")} /><textarea className="search" rows={3} maxLength={4000} value={editBack} onChange={(event)=>setEditBack(event.target.value)} aria-label={t("ظهر البطاقة", "Card back")} /><div style={{display:"flex",gap:6}}><button type="button" className="btn" disabled={busy||!editFront.trim()||!editBack.trim()} onClick={()=>void saveCard(card)}>{t("حفظ", "Save")}</button><button type="button" className="btn" disabled={busy} onClick={()=>setEditingCard(null)}>{t("إلغاء", "Cancel")}</button></div></div>:<div><h3 dir="auto">{card.front}</h3><p dir="auto">{card.back}</p></div>}<div style={{display:"flex",gap:6,flexWrap:"wrap"}}><span className="pill">{card.state}</span>{editingCard!==card.id&&<><button type="button" className="btn" disabled={busy} onClick={()=>beginCardEdit(card)}>{t("تعديل", "Edit")}</button><button type="button" className="btn" disabled={busy} onClick={()=>void removeCard(card)}>{t("حذف", "Delete")}</button></>}</div></li>)}</ol></>}</div>
    </section>}

    {view === "review" && <section className="panel" style={{maxWidth:760,margin:"0 auto",padding:28}}>{dueCard ? <><div className="panel-head"><div><span className="pill">{dueCards.length} {t("مستحقة", "due")}</span><h2>{decks.find((deck)=>deck.id===dueCard.deck_id)?.title}</h2></div><span>{dueCard.position}</span></div><button type="button" className="noata-flashcard noata-flip-card" aria-pressed={revealed} onClick={()=>setRevealed((value)=>!value)} style={{width:"100%"}}><small>{revealed ? t("الإجابة", "Answer") : t("السؤال", "Question")}</small><strong dir="auto">{revealed ? dueCard.back : dueCard.front}</strong><small>{t("اضغط لقلب البطاقة", "Press to flip")}</small></button><div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginTop:18}}>{([0,1,2,3] as const).map((rating)=><button type="button" className="btn" disabled={!revealed || busy} key={rating} onClick={()=>void review(rating)}>{[t("مرة أخرى", "Again"),t("صعب", "Hard"),t("جيد", "Good"),t("سهل", "Easy")][rating]}</button>)}</div><p style={{color:"var(--muted)",marginTop:16}}>{t("تُحفظ النتيجة مرة واحدة بمفتاح آمن، ويحسب الخادم الموعد التالي. هذه ليست درجة اختبار.", "The server records the outcome once and schedules the next estimate. This is not an assessment score.")}</p></> : <div className="noata-empty"><h2>{t("لا توجد بطاقات مستحقة الآن", "No cards are due now")}</h2><p>{decks.some((deck)=>deck.status==="draft") ? t("لديك مسودات بطاقات. راجعها وفعّلها من تبويب المجموعات.", "You have draft decks. Review and activate them from Decks.") : t("أنشئ مجموعة أو عد لاحقًا عند حلول موعد المراجعة التالي.", "Create a deck or return when the next review is due.")}</p></div>}</section>}
  </>;
}
