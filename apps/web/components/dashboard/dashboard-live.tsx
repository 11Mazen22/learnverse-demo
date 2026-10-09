"use client";
import { NoataLogo } from "@/components/ui/noata-logo";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
import { dashboardRecommendation, dashboardVisibility, type DashboardAvailability } from "@/lib/dashboard/visibility";
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
  nextLesson: { id: string; title_ar: string } | null;
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
  const unavailable = visibility.waiting ? "بنحمّل رحلتك…" : signedIn ? "البيانات غير متاحة الآن" : "ادخل حسابك لعرض تقدّمك";
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
            .select("id,title_ar")
            .eq("active", true)
            .order("created_at")
            .limit(1),
          supabase
            .from("lessons")
            .select("id,title_ar,position")
            .order("position"),
          Promise.resolve({ data: { user: account.user } }),
        ]);
        if (coursesResult.error || lessonsResult.error)
          throw Error("تعذّر تحميل رحلتك. جرّب تاني لما الاتصال يرجع.");
        const user = auth.data.user,
          lessons = lessonsResult.data ?? [];
        const next: State = {
          ...initial,
          ownerId: user?.id ?? null,
          revision,
          catalogReady: true,
          signedIn: Boolean(user),
          lessons: lessons.length,
          courseTitle: coursesResult.data?.[0]?.title_ar ?? initial.courseTitle,
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
            setError("بعض بيانات حسابك غير متاحة الآن. ما يظهر من تقدّم أو رصيد تم تحميله بنجاح؛ يمكنك تصفّح الدروس وإعادة المحاولة.");
        }
        if (alive && revision === account.revision.current) setState(next);
      } catch (e) {
        if (alive && revision === account.revision.current) setError(e instanceof Error ? e.message : "تعذّر الاتصال.");
      } finally {
        if (alive && revision === account.revision.current) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase, retry, account.user, account.loading]);
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
  const recommendation = dashboardRecommendation(visibility, due, state.nextLesson);
  const metrics = [
    ["مستواك الحالي", level, state.xp + " نقطة خبرة", "boss", visibility.profile],
    [
      "إتقان المهارات",
      mastery + "%",
      state.masteryRows.length + " مهارات في رحلتك",
      "chart",
      visibility.evidence,
    ],
    [
      "سلسلة التعلّم",
      state.streak + " أيام",
      visibility.evidence ? due + " مراجعات مستحقة" : "المراجعات غير متاحة الآن",
      "target",
      visibility.profile,
    ],
    [
      "رصيد المكافآت",
      state.coins.toLocaleString(),
      "عملات كسبتها بتعلّمك",
      "gift",
      visibility.profile,
    ],
  ] as const;
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="tiny-label">مساحتك لتكتشف أكثر</span>
          <h1>
            {Boolean(account.user) && state.signedIn
              ? `أهلاً${state.displayName ? "، " + state.displayName : ""}. جاهز لخطوة جديدة؟`
              : "كل يوم، نسخة أذكى منك."}
          </h1>
          <p>مساحتك للتعلّم، التجربة، واكتشاف اللي تقدر تعمله.</p>
        </div>
        <span className="date-chip">
          <Icon name="clock" size={15} />
          رحلتك تبدأ من هنا
        </span>
      </div>
      {(account.error || (!account.loading && errorRevision.current === account.revision.current && error)) && (
        <div className="error-banner" role="alert" data-dashboard-retry>
          {account.error || error}{" "}
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
            إعادة المحاولة
          </button>
        </div>
      )}
      <section className="hero dashboard-hero">
        <div>
          <div className="eyebrow">NOÄTA · LEARN. GROW. ACHIEVE.</div>
          <h2>
            {Boolean(account.user) && state.signedIn
              ? "خطوة النهارده، بتفتح طريق بكرة."
              : "مش بس تذاكر. افهم، جرّب، واتقدّم."}
          </h2>
          <p>
            {Boolean(account.user) && state.signedIn
              ? visibility.progress && state.nextLesson
                ? "كمّل «" +
                  state.nextLesson.title_ar +
                  "» وخلّي كل فكرة جديدة خطوة في رحلتك."
                : "استكشف الدروس وراجع اللي اتعلمته على مهلك."
              : "دروس واضحة، تحديات بتكبر معاك، ومساعد ذكي يفكّر معاك خطوة بخطوة."}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href={nextHref}>
              {Boolean(account.user) && state.signedIn
                ? "كمّل التعلّم"
                : "استكشف رحلتك"}
              <Icon name="arrow" size={17} />
            </Link>
            <Link className="btn btn-secondary" href="/ai">
              خلّينا نسأل Noata
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
            <Icon name="ai" size={16} /> كل سؤال يفتح أفقًا
          </span>
        </div>
      </section>
      <nav className="aura-learning-paths" aria-label="طرق التعلّم في Noata">
        <Link href="/learn">
          <span>01</span>
          <div>
            <strong>افهم الفكرة</strong>
            <small>دروس تبني فهمك خطوة بخطوة</small>
          </div>
          <Icon name="book" />
        </Link>
        <Link href="/missions">
          <span>02</span>
          <div>
            <strong>جرّب بنفسك</strong>
            <small>تحديات تكشف ما أتقنته</small>
          </div>
          <Icon name="target" />
        </Link>
        <Link href="/review">
          <span>03</span>
          <div>
            <strong>خلّي المعرفة معاك</strong>
            <small>مراجعة في الوقت المناسب</small>
          </div>
          <Icon name="review" />
        </Link>
      </nav>
      <section
        className="aura-next-step"
        aria-label="اقتراح خطوة التعلّم التالية"
      >
        <div className="aura-next-step-icon" aria-hidden="true">
          <Icon name={recommendation.icon} size={24} />
        </div>
        <div className="aura-next-step-copy">
          <span>خطوتك المقترحة</span>
          <h2>{recommendation.title}</h2>
          <p>
            {visibility.waiting
              ? "بنحدد خطوتك بناءً على تقدّمك…"
              : recommendation.description}
          </p>
        </div>
        <Link href={recommendation.href} className="aura-next-step-action">
          {recommendation.action} <Icon name="arrow" size={17} />
        </Link>
      </section>
      <section className="grid-4" aria-label="تقدمك" aria-busy={visibility.waiting}>
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
        <h2>اختار خطوتك الجاية</h2>
        <Link href="/learn">كل الدروس ←</Link>
      </div>
      <div className="quick-grid">
        {[
          [
            "/missions",
            "target",
            "تحدّي صغير، فهم أكبر",
            "ثلاث خطوات تختبر بيهم فهمك.",
          ],
          [
            "/review",
            "review",
            due ? "عندك " + due + " مراجعات" : "ثبّت اللي اتعلمته",
            "ارجع لأفكارك في الوقت المناسب.",
          ],
          [
            "/assignments",
            "check",
            "مساحة الواجبات",
            "تابع المطلوب منك وملاحظات مدرّسك.",
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
            <h2>رحلتك الحالية</h2>
            {visibility.progress && <span className="pill">{percent}% مكتمل</span>}
          </div>
          <div className="quest">
            <div className="quest-icon">
              <Icon name="book" />
            </div>
            <div>
              <h3>{visibility.catalog ? "تقدّمك عبر الدروس المتاحة" : "اكتشف مسارك الأول"}</h3>
              <p>
                {visibility.progress
                  ? state.completedLessons + " من " + state.lessons + " دروس مكتملة"
                  : unavailable}
              </p>
            </div>
            <Link href={nextHref} className="icon-btn" aria-label="كمّل رحلتك">
              <Icon name="arrow" />
            </Link>
          </div>
          {visibility.progress && <div
            className="progress"
            role="progressbar"
            aria-label="إكمال الدروس"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ width: percent + "%" }} />
          </div>}
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 18 }}>
            {Boolean(account.user) && state.signedIn
              ? "كل محاولة فرصة للفهم. خُد وقتك وركّز على تقدّمك."
              : "سجّل الدخول علشان تحفظ تقدّمك وتكمّل من أي جهاز."}
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
                ابدأ حسابك
              </Link>
            )}
        </article>
        <aside>
          <div className="rank-card">
            <span className="tiny-label">YOUR NEXT MILESTONE</span>
            <strong>{visibility.profile ? "المستوى " + level : "خطوتك القادمة"}</strong>
            <small>{visibility.profile ? "باقي " + (100 - (state.xp % 100)) + " نقطة خبرة لخطوتك الجاية" : unavailable}</small>
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
                ? state.unread + " إشعارات جديدة"
                : "مساحة آخر الأخبار"}
            </b>
            <small>{signedIn && !visibility.notifications ? "عدّاد الإشعارات غير متاح الآن" : "الواجبات الجديدة وتحديثات رحلتك."}</small>
          </Link>
        </aside>
      </section>
    </>
  );
}
