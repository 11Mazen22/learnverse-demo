"use client";
import { NoataLogo } from "@/components/ui/noata-logo";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
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
  const account = useVerifiedAccount();
  const [state, setState] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const supabase = useMemo(() => createClient(), []);
  useEffect(() => {
    if (account.loading) return;
    let alive = true;
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
          if (p.error || m.error || progress.error) {
            if (alive) setError("بعض تفاصيل تقدّم حسابك غير متاحة الآن. يمكنك تصفح دروسك والمحاولة مجددًا.");
          } else {
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
              unread: n.error ? 0 : (n.count ?? 0),
            });
            if (n.error && alive) setError("تقدّمك متاح، لكن عدّاد الإشعارات لم يتحدّث. جرّب تحديث الصفحة لاحقًا.");
          }
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
  const signedIn = Boolean(account.user) && state.signedIn;
  const nextHref = signedIn && state.nextLesson
    ? "/lesson/" + state.nextLesson.id
    : "/learn";
  // Personalized but deterministic: recommendations derive exclusively from
  // the learner's real review queue and course progress.
  const recommendation =
    !signedIn
      ? {
          href: "/learn",
          title: "ابدأ رحلة تعلّم تناسبك",
          description: "استكشف الدروس المتاحة؛ تسجيل الدخول يحفظ تقدّمك وينقل تجربتك بين الأجهزة.",
          action: "استكشف رحلة التعلّم",
          icon: "book",
        }
      : due > 0
      ? {
          href: "/review",
          title: "راجع اللي محتاج تثبيت",
          description:
            "عندك " +
            due +
            " مراجعات حان وقتها. المراجعة الأول هتساعدك تبني على فهم ثابت.",
          action: "ابدأ المراجعة",
          icon: "review",
        }
      : state.nextLesson
        ? {
            href: nextHref,
            title: "كمّل رحلتك من آخر نقطة",
            description:
              "درس «" +
              state.nextLesson.title_ar +
              "» هو خطوتك التالية في المسار الحالي.",
            action: "افتح الدرس",
            icon: "book",
          }
        : {
            href: "/missions",
            title: "جاهز تتحدّى نفسك؟",
            description: "اختار تحدّي قصير وجرّب تثبّت اللي عرفته.",
            action: "استكشف المهام",
            icon: "target",
          };
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
      {(error || account.error) && (
        <div className={account.user || account.error ? "error-banner" : "aura-guest-service-notice"} role={account.user || account.error ? "alert" : "status"}>
          {account.user || account.error ? error || account.error : "الدروس العامة غير متاحة مؤقتًا بسبب الاتصال. تقدر تتنقل بين الأقسام وتحاول مرة تانية."}{" "}
          <button
            className="btn"
            onClick={() => {
              if (account.error) void account.refresh();
              else setRetry((x) => x + 1);
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
              ? state.nextLesson
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
            {loading
              ? "بنحدد خطوتك بناءً على تقدّمك…"
              : recommendation.description}
          </p>
        </div>
        <Link href={recommendation.href} className="aura-next-step-action">
          {recommendation.action} <Icon name="arrow" size={17} />
        </Link>
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
            <strong>{loading || error || !signedIn ? "—" : value}</strong>
            <small>{loading ? "بنحمّل رحلتك…" : !signedIn ? "سجّل الدخول علشان تشوف بياناتك الحقيقية" : detail}</small>
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
            <span className="pill">{signedIn && !error ? percent + "% مكتمل" : "رحلتك التعليمية"}</span>
          </div>
          <div className="quest">
            <div className="quest-icon">
              <Icon name="book" />
            </div>
            <div>
              <h3>{state.courseTitle}</h3>
              <p>
                {signedIn ? state.completedLessons + " من " + state.lessons + " دروس مكتملة" : "استكشف الدروس وابدأ التعلّم على مهلك"}
              </p>
            </div>
            <Link href={nextHref} className="icon-btn" aria-label="كمّل رحلتك">
              <Icon name="arrow" />
            </Link>
          </div>
          {signedIn && !error && (
            <div className="progress" role="progressbar" aria-label="إكمال الدروس"
              aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: percent + "%" }} />
            </div>
          )}
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
            <strong>{signedIn && !error ? "المستوى " + level : "إنجازاتك تبدأ مع حسابك"}</strong>
            <small>{signedIn && !error ? "باقي " + (100 - (state.xp % 100)) + " نقطة خبرة لخطوتك الجاية" : "سجّل الدخول علشان تشوف نقاطك ومستواك الحقيقي"}</small>
            {signedIn && !error && <div className="progress"><i style={{ width: (state.xp % 100) + "%" }} /></div>}
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
