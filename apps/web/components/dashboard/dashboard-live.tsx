"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/icon";
type State = {
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
  const [state, setState] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    let alive = true;
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
          supabase.auth.getUser(),
        ]);
        if (coursesResult.error || lessonsResult.error)
          throw Error("تعذّر تحميل رحلتك. جرّب تاني لما الاتصال يرجع.");
        const user = auth.data.user,
          lessons = lessonsResult.data ?? [];
        const next: State = {
          ...initial,
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
              .single(),
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
          if (p.error || m.error || progress.error || n.error)
            throw Error("تعذّر تحميل تقدّمك. بياناتك محفوظة؛ حاول مرة تانية.");
          const done = new Set(
            (progress.data ?? [])
              .filter((x) => x.completed_at)
              .map((x) => x.lesson_id),
          );
          Object.assign(next, {
            displayName: p.data?.display_name || "",
            xp: Number(p.data?.xp ?? 0),
            coins: Number(p.data?.coins ?? 0),
            streak: Number(p.data?.streak_days ?? 0),
            masteryRows: m.data ?? [],
            completedLessons: lessons.filter((l) => done.has(l.id)).length,
            nextLesson: lessons.find((l) => !done.has(l.id)) ?? null,
            unread: n.count ?? 0,
          });
        }
        if (alive) setState(next);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "تعذّر الاتصال.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [supabase, retry]);
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
  const nextHref = state.nextLesson
    ? "/lesson/" + state.nextLesson.id
    : "/learn";
  const metrics = [
    ["مستواك الحالي", level, state.xp + " نقطة خبرة", "boss"],
    [
      "إتقان المهارات",
      mastery + "%",
      state.masteryRows.length + " مهارات في رحلتك",
      "chart",
    ],
    [
      "سلسلة التعلّم",
      state.streak + " أيام",
      due + " مراجعات مستحقة",
      "target",
    ],
    [
      "رصيد المكافآت",
      state.coins.toLocaleString(),
      "عملات كسبتها بتعلّمك",
      "gift",
    ],
  ] as const;
  return (
    <>
      <div className="dashboard-welcome">
        <div>
          <span className="tiny-label">A LITTLE CURIOSITY, EVERY DAY</span>
          <h1>
            {state.signedIn
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
      {error && (
        <div className="error-banner" role="alert">
          {error}{" "}
          <button className="btn" onClick={() => setRetry((x) => x + 1)}>
            إعادة المحاولة
          </button>
        </div>
      )}
      <section className="hero dashboard-hero">
        <div>
          <div className="eyebrow">LET YOUR CURIOSITY LEAD</div>
          <h2>
            {state.signedIn
              ? "خطوة النهارده، بتفتح طريق بكرة."
              : "مش بس تذاكر. افهم، جرّب، واتقدّم."}
          </h2>
          <p>
            {state.signedIn
              ? state.nextLesson
                ? "كمّل «" +
                  state.nextLesson.title_ar +
                  "» وخلّي كل فكرة جديدة خطوة في رحلتك."
                : "استكشف الدروس وراجع اللي اتعلمته على مهلك."
              : "دروس واضحة، تحديات بتكبر معاك، ومساعد ذكي يفكّر معاك خطوة بخطوة."}
          </p>
          <div className="hero-actions">
            <Link className="btn btn-primary" href={nextHref}>
              {state.signedIn ? "كمّل التعلّم" : "استكشف رحلتك"}
              <Icon name="arrow" size={17} />
            </Link>
            <Link className="btn btn-secondary" href="/ai">
              خلّينا نسأل Noata
              <Icon name="ai" size={16} />
            </Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit-ring" />
          <div className="orbit-ring second" />
          <div className="orbit-core">
            <Icon name="book" size={48} />
          </div>
          <span className="orbit-satellite">
            <Icon name="ai" size={23} />
          </span>
          <span className="orbit-satellite">
            <Icon name="check" size={23} />
          </span>
        </div>
      </section>
      <section className="grid-4" aria-label="تقدمك" aria-busy={loading}>
        {metrics.map(([label, value, detail, icon]) => (
          <article className="metric-card" key={label}>
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
            <strong>{loading || error ? "—" : value}</strong>
            <small>{loading ? "بنحمّل رحلتك…" : detail}</small>
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
            <span className="pill">{percent}% مكتمل</span>
          </div>
          <div className="quest">
            <div className="quest-icon">
              <Icon name="book" />
            </div>
            <div>
              <h3>{state.courseTitle}</h3>
              <p>
                {state.completedLessons} من {state.lessons} دروس مكتملة
              </p>
            </div>
            <Link href={nextHref} className="icon-btn" aria-label="كمّل رحلتك">
              <Icon name="arrow" />
            </Link>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label="إكمال الدروس"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <i style={{ width: percent + "%" }} />
          </div>
          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 18 }}>
            {state.signedIn
              ? "كل محاولة فرصة للفهم. خُد وقتك وركّز على تقدّمك."
              : "سجّل الدخول علشان تحفظ تقدّمك وتكمّل من أي جهاز."}
          </p>
          {!state.signedIn && !loading && (
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
            <strong>المستوى {level}</strong>
            <small>باقي {100 - (state.xp % 100)} نقطة خبرة لخطوتك الجاية</small>
            <div className="progress">
              <i style={{ width: (state.xp % 100) + "%" }} />
            </div>
          </div>
          <Link
            href="/notifications"
            className="quick-card"
            style={{ marginTop: 16 }}
          >
            <Icon name="check" />
            <b>
              {state.unread
                ? state.unread + " إشعارات جديدة"
                : "مساحة آخر الأخبار"}
            </b>
            <small>الواجبات الجديدة وتحديثات رحلتك.</small>
          </Link>
        </aside>
      </section>
    </>
  );
}
