"use client";
import { NoataLogo } from "@/components/ui/noata-logo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { dashboardRecommendation, dashboardVisibility, type DashboardAvailability } from "@/lib/dashboard/visibility";
import { localized, useLocale } from "@/lib/i18n/locale";
type State = DashboardAvailability & {
  signedIn: boolean;
  displayName: string;
  xp: number;
  coins: number;
  streak: number;
  masteryRows: {
    mastery_score: number;
    state: string;
    next_review_at: string | null;
  }[];
  lessons: number;
  completedLessons: number;
  courseTitle: string;
  nextLesson: { id: string; title_ar: string; title_en: string } | null;
  unread: number;
};
const initial: State = {
  ownerId: null,
  revision: -1,
  catalogReady: false,
  profileReady: false,
  evidenceReady: false,
  progressReady: false,
  notificationsReady: false,
  signedIn: false,
  displayName: "",
  xp: 0,
  coins: 0,
  streak: 0,
  masteryRows: [],
  lessons: 0,
  completedLessons: 0,
  courseTitle: "اكتشف مسارك الأول",
  nextLesson: null,
  unread: 0,
};
export function DashboardLive() {
  const locale = useLocale();
  const t = useCallback((ar: string, en: string) => localized(locale, ar, en), [locale]);
  const account = useVerifiedAccount();
  const [snapshot, setState] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const errorRevision = useRef(-1);
  const supabase = useMemo(() => createClient(), []);
  const visibility = dashboardVisibility(snapshot, {
    userId: account.user?.id ?? null,
    revision: account.revision.current,
    loading: account.loading,
    error: account.error,
  }, loading);
  const state = visibility.current ? snapshot : initial;
  const signedIn = Boolean(account.user) && !account.loading && !account.error;
  const unavailable = visibility.waiting ? t("بنحمّل رحلتك…","Loading your journey…") : signedIn ? t("البيانات غير متاحة الآن","Data is unavailable right now") : t("ادخل حسابك لعرض تقدّمك","Sign in to view your progress");
  useEffect(() => {
    if (account.loading) return;
    let alive = true;
    const revision = account.revision.current;
    errorRevision.current = revision;
    setState(initial);
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const [coursesResult, lessonsResult, auth] = await Promise.all([
          supabase
            .from("courses")
             .select("id,title_ar,title_en")
            .eq("active", true)
            .order("created_at")
            .limit(1),
          supabase
            .from("lessons")
             .select("id,title_ar,title_en,position")
            .order("position"),
          Promise.resolve({ data: { user: account.user } }),
        ]);
        if (coursesResult.error || lessonsResult.error)
           throw Error(t("تعذّر تحميل رحلتك. جرّب تاني لما الاتصال يرجع.","Could not load your journey. Try again when your connection returns."));
        const user = auth.data.user,
          lessons = lessonsResult.data ?? [];
        const next: State = {
          ...initial,
          ownerId: user?.id ?? null,
          revision,
          catalogReady: true,
          signedIn: Boolean(user),
          lessons: lessons.length,
           courseTitle: t(coursesResult.data?.[0]?.title_ar ?? initial.courseTitle,coursesResult.data?.[0]?.title_en ?? "Discover your first path"),
          nextLesson: lessons[0] ?? null,
        };
        if (user) {
          const [p, m, progress, n] = await Promise.all([
            supabase
              .from("profiles")
              .select("display_name,xp,coins,streak_days")
              .eq("id", user.id)
              .maybeSingle(),
            supabase
              .from("skill_evidence")
              .select("mastery_score,state,next_review_at")
              .eq("user_id", user.id),
            supabase
              .from("lesson_progress")
              .select("lesson_id,completed_at")
              .eq("user_id", user.id),
            supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .is("read_at", null),
          ]);
          // A missing profile is allowed for a newly created staging user.
          // Optional notifications must never blank the entire learning journey.
          next.profileReady = !p.error && p.data !== null;
          next.evidenceReady = !m.error && m.data !== null;
          next.progressReady = !progress.error && progress.data !== null;
          next.notificationsReady = !n.error && n.count !== null;
          if (next.profileReady) Object.assign(next, {
            displayName: p.data?.display_name || "",
            xp: Number(p.data?.xp),
            coins: Number(p.data?.coins),
            streak: Number(p.data?.streak_days),
          });
          if (next.evidenceReady) next.masteryRows = m.data ?? [];
          if (next.progressReady) {
            const done = new Set(
              (progress.data ?? [])
                .filter((x) => x.completed_at)
                .map((x) => x.lesson_id),
            );
            next.completedLessons = lessons.filter((lesson) => done.has(lesson.id)).length;
            next.nextLesson = lessons.find((lesson) => !done.has(lesson.id)) ?? null;
          }
          if (next.notificationsReady) next.unread = n.count ?? 0;
          if ((!next.profileReady || !next.evidenceReady || !next.progressReady || !next.notificationsReady) && alive && revision === account.revision.current)
             setError(t("بعض بيانات حسابك غير متاحة الآن. ما يظهر من تقدّم أو رصيد تم تحميله بنجاح؛ يمكنك تصفّح الدروس وإعادة المحاولة.","Some account data is unavailable. The progress and balance shown were loaded successfully. You can browse lessons and retry."));
        }
        if (alive && revision === account.revision.current) setState(next);
      } catch (e) {
         if (alive && revision === account.revision.current) setError(e instanceof Error ? e.message : t("تعذّر الاتصال.","Could not connect."));
      } finally {
        if (alive && revision === account.revision.current) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
   }, [supabase, retry, account.user, account.loading, t]);
  const level = Math.floor(state.xp / 100) + 1,
    mastery = state.masteryRows.length
      ? Math.round(
          state.masteryRows.reduce((s, r) => s + Number(r.mastery_score), 0) /
            state.masteryRows.length,
        )
      : 0;
  const due = state.masteryRows.filter(
    (r) => r.next_review_at && new Date(r.next_review_at) <= new Date(),
  ).length;
  const percent = state.lessons
    ? Math.round((state.completedLessons / state.lessons) * 100)
    : 0;
  const nextHref = visibility.progress && state.nextLesson
    ? "/lesson/" + encodeURIComponent(state.nextLesson.id)
    : "/learn";
  // Personalized but deterministic: recommendations derive exclusively from
  // the learner's real review queue and course progress.
   const recommendation = dashboardRecommendation(visibility, due, state.nextLesson, locale);
  const metrics = [
     [t("مستواك الحالي","Your level"), level, state.xp + t(" نقطة خبرة"," XP"), "boss", visibility.profile],
    [
       t("إتقان المهارات","Skill mastery"),
      mastery + "%",
       state.masteryRows.length + t(" مهارات في رحلتك"," skills in your journey"),
      "chart",
      visibility.evidence,
    ],
    [
       t("سلسلة التعلّم","Learning streak"),
       state.streak + t(" أيام"," days"),
       visibility.evidence ? due + t(" مراجعات مستحقة"," reviews due") : t("المراجعات غير متاحة الآن","Reviews unavailable"),
      "target",
      visibility.profile,
    ],
    [
       t("رصيد المكافآت","Reward balance"),
      state.coins.toLocaleString(),
       t("عملات كسبتها بتعلّمك","Coins earned through learning"),
      "gift",
      visibility.profile,
    ],
  ] as const;
  return (
    <>
      <div className="dashboard-welcome">
        <div>
           <span className="tiny-label">{t("مساحتك لتكتشف أكثر","Your space to discover more")}</span>
          <h1>
            {Boolean(account.user) && state.signedIn
               ? t(`أهلاً${state.displayName ? "، " + state.displayName : ""}. جاهز لخطوة جديدة؟`,`Welcome${state.displayName ? ", " + state.displayName : ""}. Ready for a new step?`)
               : t("كل يوم، نسخة أذكى منك.","Grow a little wiser every day.")}
          </h1>
           <p>{t("مساحتك للتعلّم، التجربة، واكتشاف اللي تقدر تعمله.","A place to learn, experiment, and discover what you can do.")}</p>
        </div>
        <span className="date-chip">
          <Icon name="clock" size={15} />
           {t("رحلتك تبدأ من هنا","Your journey starts here")}
        </span>
      </div>
      {(account.error || (!account.loading && errorRevision.current === account.revision.current && error)) && (
        <div className={account.user || account.error ? "error-banner" : "aura-guest-service-notice"} role={account.user || account.error ? "alert" : "status"} data-dashboard-retry>
           {account.user || account.error ? account.error || error : t("الدروس العامة غير متاحة مؤقتًا بسبب الاتصال. تقدر تتنقل بين الأقسام وتحاول مرة تانية.","Public lessons are temporarily unavailable. You can still explore other sections and try again.")}{" "}
          <button
            type="button"
            className="btn"
            disabled={visibility.waiting}
            onClick={() => {
              if (account.error) void account.refresh();
              else {
                setLoading(true);
                setState(initial);
                setRetry((x) => x + 1);
              }
            }}
          >
             {t("إعادة المحاولة","Try again")}
          </button>
        </div>
      )}
      <section className="hero dashboard-hero">
        <div>
           <div className="eyebrow">NOATA · LEARN. GROW. ACHIEVE.</div>
          <h2>
            {Boolean(account.user) && state.signedIn
               ? t("خطوة النهارده، بتفتح طريق بكرة.","Today's step opens tomorrow's path.")
               : t("مش بس تذاكر. افهم، جرّب، واتقدّم.","Go beyond studying. Understand, try, and grow.")}
          </h2>
          <p>
            {Boolean(account.user) && state.signedIn
              ? visibility.progress && state.nextLesson
                 ? t("كمّل «" + state.nextLesson.title_ar + "» وخلّي كل فكرة جديدة خطوة في رحلتك.","Continue “" + (state.nextLesson.title_en || state.nextLesson.title_ar) + "” and make each new idea part of your journey.")
                 : t("استكشف الدروس وراجع اللي اتعلمته على مهلك.","Explore lessons and review what you have learned at your own pace.")
               : t("دروس واضحة، تحديات بتكبر معاك، ومساعد ذكي يفكّر معاك خطوة بخطوة.","Clear lessons, growing challenges, and an AI companion to think things through with you.")}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href={nextHref}>
              {Boolean(account.user) && state.signedIn
                 ? t("كمّل التعلّم","Continue learning")
                 : t("استكشف رحلتك","Explore your journey")}
              <Icon name="arrow" size={17} />
            </Link>
            <Link className="btn btn-secondary" href="/ai">
               {t("خلّينا نسأل Noata","Ask Noata")}
              <Icon name="ai" size={16} />
            </Link>
          </div>
        </div>
        <div className="aura-brand-scene" aria-hidden="true">
          <div className="aura-brand-halo" />
          <NoataLogo size={174} className="noata-logo-on-navy" />
          <span className="aura-scene-caption" dir="ltr">
            Learn. Grow. Achieve.
          </span>
          <span className="aura-scene-note">
             <Icon name="ai" size={16} /> {t("كل سؤال يفتح أفقًا","Every question opens a new path")}
          </span>
        </div>
      </section>
       <nav className="aura-learning-paths" aria-label={t("طرق التعلّم في Noata","Ways to learn in Noata")}>
        <Link href="/learn">
          <span>01</span>
          <div>
             <strong>{t("افهم الفكرة","Understand the idea")}</strong>
             <small>{t("دروس تبني فهمك خطوة بخطوة","Lessons that build understanding step by step")}</small>
          </div>
          <Icon name="book" />
        </Link>
        <Link href="/missions">
          <span>02</span>
          <div>
             <strong>{t("جرّب بنفسك","Try it yourself")}</strong>
             <small>{t("تحديات تكشف ما أتقنته","Challenges that show what you know")}</small>
          </div>
          <Icon name="target" />
        </Link>
        <Link href="/review">
          <span>03</span>
          <div>
             <strong>{t("خلّي المعرفة معاك","Make knowledge stick")}</strong>
             <small>{t("مراجعة في الوقت المناسب","Review at the right time")}</small>
          </div>
          <Icon name="review" />
        </Link>
      </nav>
      <section
        className="aura-next-step"
         aria-label={t("اقتراح خطوة التعلّم التالية","Suggested next learning step")}
      >
        <div className="aura-next-step-icon" aria-hidden="true">
          <Icon name={recommendation.icon} size={24} />
        </div>
        <div className="aura-next-step-copy">
           <span>{t("خطوتك المقترحة","Your suggested step")}</span>
          <h2>{recommendation.title}</h2>
          <p>
            {visibility.waiting
               ? t("بنحدد خطوتك بناءً على تقدّمك…","Finding a step based on your progress…")
              : recommendation.description}
          </p>
        </div>
        <Link href={recommendation.href} className="aura-next-step-action">
          {recommendation.action} <Icon name="arrow" size={17} />
        </Link>
      </section>
       <section className="grid-4" aria-label={t("تقدمك","Your progress")} aria-busy={visibility.waiting}>
        {metrics.map(([label, value, detail, icon, available]) => (
          <article className="metric-card" key={label} data-dashboard-available={available}>
            <Icon
              name={icon}
              style={{
                position: "absolute",
                insetInlineEnd: 20,
                top: 20,
                color: "var(--accent)",
              }}
            />
            <span>{label}</span>
            <strong>{available ? value : "—"}</strong>
            <small>{available ? detail : unavailable}</small>
          </article>
        ))}
      </section>
      <div className="section-heading">
         <h2>{t("اختار خطوتك الجاية","Choose your next step")}</h2>
         <Link href="/learn">{t("كل الدروس ←","All lessons →")}</Link>
      </div>
      <div className="quick-grid">
        {[
          [
            "/missions",
            "target",
             t("تحدّي صغير، فهم أكبر","A small challenge, deeper understanding"),
             t("ثلاث خطوات تختبر بيهم فهمك.","Three steps to check your understanding."),
          ],
          [
            "/review",
            "review",
             due ? t("عندك " + due + " مراجعات",`${due} reviews waiting`) : t("ثبّت اللي اتعلمته","Make learning stick"),
             t("ارجع لأفكارك في الوقت المناسب.","Return to key ideas at the right time."),
          ],
          [
            "/assignments",
            "check",
             t("مساحة الواجبات","Assignments"),
             t("تابع المطلوب منك وملاحظات مدرّسك.","See your tasks and your teacher's feedback."),
          ],
        ].map(([href, icon, title, desc]) => (
          <Link className="quick-card" href={href} key={href}>
            <Icon name={icon} />
            <b>{title}</b>
            <small>{desc}</small>
          </Link>
        ))}
      </div>
      <section className="content-grid">
        <article className="panel">
          <div className="panel-head">
             <h2>{t("رحلتك الحالية","Your current journey")}</h2>
             {visibility.progress && <span className="pill">{percent}% {t("مكتمل","complete")}</span>}
          </div>
          <div className="quest">
            <div className="quest-icon">
              <Icon name="book" />
            </div>
            <div>
               <h3>{visibility.catalog ? t("تقدّمك عبر الدروس المتاحة","Your progress through available lessons") : t("اكتشف مسارك الأول","Discover your first path")}</h3>
              <p>
                {visibility.progress
                   ? t(state.completedLessons + " من " + state.lessons + " دروس مكتملة",`${state.completedLessons} of ${state.lessons} lessons completed`)
                  : unavailable}
              </p>
            </div>
             <Link href={nextHref} className="icon-btn" aria-label={t("كمّل رحلتك","Continue your journey")}>
              <Icon name="arrow" />
            </Link>
          </div>
          {visibility.progress && <div
            className="progress"
            role="progressbar"
             aria-label={t("إكمال الدروس","Lesson completion")}
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ width: percent + "%" }} />
          </div>}
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 18 }}>
            {Boolean(account.user) && state.signedIn
               ? t("كل محاولة فرصة للفهم. خُد وقتك وركّز على تقدّمك.","Every attempt is a chance to understand. Take your time and focus on your progress.")
               : t("سجّل الدخول علشان تحفظ تقدّمك وتكمّل من أي جهاز.","Sign in to save your progress and continue on any device.")}
          </p>
          {!(Boolean(account.user) && state.signedIn) &&
            !account.loading &&
            !loading && (
              <Link
                className="btn"
                href="/login"
                style={{
                  background: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                 {t("ابدأ حسابك","Create your account")}
              </Link>
            )}
        </article>
        <aside>
          <div className="rank-card">
            <span className="tiny-label">YOUR NEXT MILESTONE</span>
             <strong>{visibility.profile ? t("المستوى " + level,"Level " + level) : t("خطوتك القادمة","Your next step")}</strong>
             <small>{visibility.profile ? t("باقي " + (100 - (state.xp % 100)) + " نقطة خبرة لخطوتك الجاية",`${100 - (state.xp % 100)} XP to your next level`) : unavailable}</small>
            {visibility.profile && <div className="progress">
              <i style={{ width: (state.xp % 100) + "%" }} />
            </div>}
          </div>
          <Link
            href="/notifications"
            className="quick-card"
            style={{ marginTop: 16 }}
          >
            <Icon name="check" />
            <b>
              {visibility.notifications && state.unread
                 ? t(state.unread + " إشعارات جديدة",`${state.unread} new notifications`)
                 : t("مساحة آخر الأخبار","Latest updates")}
            </b>
             <small>{signedIn && !visibility.notifications ? t("عدّاد الإشعارات غير متاح الآن","Notification count unavailable") : t("الواجبات الجديدة وتحديثات رحلتك.","New assignments and updates to your journey.")}</small>
          </Link>
        </aside>
      </section>
    </>
  );
}
