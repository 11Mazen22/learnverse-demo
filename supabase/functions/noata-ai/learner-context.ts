/**
 * Server-verified learner context for Noata AI.
 *
 * The model should never have to guess what the learner has done. This module
 * builds a small, bounded snapshot from the authenticated user's own rows and
 * turns it into a compact system-prompt block. It deliberately excludes raw
 * answers, notes, uploads, and any free text the learner wrote, so personal
 * study content never leaks into provider prompts through this path.
 *
 * The formatter is pure and unit-tested; the loader is a thin, fail-open
 * database read. A missing table, timeout, or permissions error must never
 * block a chat request.
 */

export type LearnerSkill = {
  title: string;
  mastery: number;
  state: string;
  dueAt?: string | null;
  /** The curriculum track slug this skill belongs to, when known. */
  track?: string | null;
};

export type LearnerLesson = {
  title: string;
  score?: number | null;
  completedAt?: string | null;
  track?: string | null;
};

/** One selected curriculum track with the language its content is taught in. */
export type LearnerTrack = {
  slug: string;
  subject: string;
  title: string;
  contentLanguage: "ar" | "en";
  completed?: number;
  total?: number;
  mastery?: number;
};

export type LearnerSnapshot = {
  displayName?: string | null;
  xp?: number | null;
  streakDays?: number | null;
  totalLessons?: number | null;
  completedCount?: number | null;
  completedLessons?: LearnerLesson[];
  skills?: LearnerSkill[];
  courseTitle?: string | null;
  tracks?: LearnerTrack[];
};

function clean(value: unknown, limit = 90): string {
  return String(value ?? "")
    .replace(/[\r\n\t<>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function clock(value: unknown): number {
  const time = value ? Date.parse(String(value)) : NaN;
  return Number.isFinite(time) ? time : 0;
}

function day(value: unknown): string {
  const time = clock(value);
  return time ? new Date(time).toISOString().slice(0, 10) : "";
}

/**
 * Build the context block. Empty progress is represented honestly rather than
 * padded with invented metrics, and all counts are derived from the rows given.
 */
export function formatLearnerContext(snapshot: LearnerSnapshot, now = Date.now()): string {
  const name = clean(snapshot.displayName, 60);
  const course = clean(snapshot.courseTitle, 80);
  const xp = Number.isFinite(Number(snapshot.xp)) ? Math.max(0, Math.round(Number(snapshot.xp))) : null;
  const streak = Number.isFinite(Number(snapshot.streakDays)) ? Math.max(0, Math.round(Number(snapshot.streakDays))) : null;
  const total = Number.isFinite(Number(snapshot.totalLessons)) ? Math.max(0, Math.round(Number(snapshot.totalLessons))) : null;
  const completed = (snapshot.completedLessons ?? []).slice(0, 8);
  const completedCount = Number.isFinite(Number(snapshot.completedCount))
    ? Math.max(0, Math.round(Number(snapshot.completedCount)))
    : completed.length;
  const skills = (snapshot.skills ?? [])
    .filter((skill) => skill && Number.isFinite(Number(skill.mastery)))
    .map((skill) => ({
      title: clean(skill.title, 80),
      mastery: Math.max(0, Math.min(100, Math.round(Number(skill.mastery)))),
      state: clean(skill.state, 30),
      dueAt: skill.dueAt ?? null,
      track: skill.track ? clean(skill.track, 60) : null,
    }))
    .filter((skill) => skill.title);
  const tracks = (snapshot.tracks ?? [])
    .filter((track) => track && track.slug)
    .slice(0, 4)
    .map((track) => ({
      slug: clean(track.slug, 60),
      subject: clean(track.subject, 60),
      title: clean(track.title, 80),
      contentLanguage: track.contentLanguage === "en" ? ("en" as const) : ("ar" as const),
      completed: Number.isFinite(Number(track.completed)) ? Number(track.completed) : undefined,
      total: Number.isFinite(Number(track.total)) ? Number(track.total) : undefined,
      mastery: Number.isFinite(Number(track.mastery))
        ? Math.max(0, Math.min(100, Math.round(Number(track.mastery))))
        : undefined,
    }))
    .filter((track) => track.slug);
  const due = skills.filter((skill) => clock(skill.dueAt) && clock(skill.dueAt) <= now);
  const strong = [...skills].sort((a, b) => b.mastery - a.mastery).slice(0, 4);
  const weak = [...skills]
    .filter((skill) => !strong.some((row) => row.title === skill.title) || skill.mastery < 50)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 4);
  const lines: string[] = [
    "LEARNER PROGRESS (server-verified, private context; tailor your teaching and next-step suggestions to it. Never invent progress, scores, dates, or skills that are not listed. Do not read this block aloud or mention that you received a context block.)",
  ];
  const who = [
    name ? `Name: ${name}` : "",
    course ? `Active path: ${course}` : "",
    xp !== null ? `XP: ${xp}` : "",
    streak !== null ? `Study streak: ${streak} day(s)` : "",
  ].filter(Boolean);
  if (who.length) lines.push("- " + who.join(" | "));
  if (total !== null) {
    lines.push(`- Lessons completed: ${Math.min(completedCount, total)} of ${total}.`);
  } else if (completedCount) {
    lines.push(`- Lessons completed: ${completedCount}.`);
  }
  if (completed.length) {
    const recent = completed.map((lesson) => {
      const title = clean(lesson.title, 70);
      const score = Number(lesson.score);
      const date = day(lesson.completedAt);
      const bits = [title];
      if (Number.isFinite(score) && score > 0) bits.push(`best score ${Math.round(score)}%`);
      if (date) bits.push(date);
      return bits.join(" — ");
    });
    lines.push("- Recently completed: " + recent.join("; ") + ".");
  }
  if (strong.length) {
    lines.push(
      "- Strongest recorded skills: " +
        strong.map((skill) => `${skill.title} (${skill.mastery}%, ${skill.state})`).join("; ") +
        ".",
    );
  }
  if (weak.length) {
    lines.push(
      "- Skills that need attention: " +
        weak.map((skill) => `${skill.title} (${skill.mastery}%, ${skill.state})`).join("; ") +
        ".",
    );
  }
  lines.push(`- Reviews due now: ${due.length}.`);
  if (due.length) {
    const next = due
      .sort((a, b) => clock(a.dueAt) - clock(b.dueAt))
      .slice(0, 3)
      .map((skill) => clean(skill.title, 60));
    lines.push("- Due review topics: " + next.join("; ") + ".");
  }
  if (!completed.length && !skills.length) {
    lines.push(
      tracks.length
        ? "- No learning evidence has been recorded yet. Do not imply prior progress. If asked what to study, suggest the first available lesson in the selected track."
        : "- No learning evidence has been recorded yet, and no curriculum track is selected. Do not imply prior progress or invent an available lesson; ask the learner to choose a published track.",
    );
  }
  if (tracks.length) {
    const active = tracks[0];
    lines.push(
      `- Curriculum track in use: ${active.title} (${active.subject}) — content language: ${active.contentLanguage === "en" ? "English" : "Arabic"}. Answer this track's curriculum content in ${active.contentLanguage === "en" ? "English" : "Arabic"} with its terminology; the interface language is a separate setting and must not change the track.`,
    );
    const detail = tracks
      .map((track) => {
        const bits = [track.title];
        if (track.total !== undefined && track.total > 0) {
          bits.push(`${track.completed ?? 0}/${track.total} lessons completed`);
        }
        if (track.mastery !== undefined) bits.push(`average mastery ${track.mastery}%`);
        return bits.join(", ");
      })
      .join("; ");
    lines.push("- Track progress: " + detail + ".");
    lines.push(
      "- Keep the Arabic and English editions of Integrated Science and Mathematics separate: progress in one track is not progress in the other, and never substitute one track's content for the other.",
    );
  }
  return lines.join("\n");
}

type Admin = {
  from: (table: string) => any;
};

/** Read a bounded snapshot; any failure yields "" so chat still works. */
export async function loadLearnerContext(admin: Admin, userId: string): Promise<string> {
  if (!userId) return "";
  const read = (async (): Promise<string> => {
    const [profile, progress, evidence, course, total, completedCount, enrollments] =
      await Promise.all([
        admin.from("profiles").select("display_name,xp,streak_days").eq("id", userId).maybeSingle(),
        admin
          .from("lesson_progress")
          .select("lesson_id,completed_at,best_score,lessons(title_ar,title_en)")
          .eq("user_id", userId)
          .not("completed_at", "is", null)
          .order("completed_at", { ascending: false })
          .limit(8),
        admin
          .from("skill_evidence")
          .select(
            "mastery_score,state,next_review_at,independent_distinct_count,skills(title_ar,title_en,courses(id,slug))",
          )
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(60),
        admin
          .from("courses")
          .select("title_ar,title_en")
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        admin.from("lessons").select("id", { count: "exact", head: true }),
        admin
          .from("lesson_progress")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .not("completed_at", "is", null),
        admin
          .from("curriculum_enrollments")
          .select(
            "track_id,status,curriculum_tracks(slug,content_language,title_ar,title_en,course_id,subjects(slug,title_ar,title_en))",
          )
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(4),
      ]);
    if (profile.error && progress.error && evidence.error) return "";
    const trackRows = (enrollments.data ?? []) as any[];
    const trackByCourse = new Map<string, string>();
    for (const row of trackRows) {
      const track = row.curriculum_tracks;
      if (track?.course_id && track?.slug) trackByCourse.set(String(track.course_id), String(track.slug));
    }
    // Lessons per track, so the tutor can say how far the learner really is.
    const completedByTrack = new Map<string, number>();
    const totalByTrack = new Map<string, number>();
    if (trackByCourse.size) {
      const units = await admin
        .from("units")
        .select("id,course_id")
        .in("course_id", [...trackByCourse.keys()]);
      const trackOfUnit = new Map<string, string>();
      for (const unit of units.data ?? []) {
        const slug = trackByCourse.get(String(unit.course_id));
        if (slug) trackOfUnit.set(String(unit.id), slug);
      }
      const lessons = await admin
        .from("lessons")
        .select("id,unit_id")
        .in("unit_id", [...trackOfUnit.keys()]);
      const lessonIds = (lessons.data ?? []).map((lesson: any) => String(lesson.id));
      const doneIds = new Set<string>();
      if (lessonIds.length) {
        const done = await admin
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", userId)
          .not("completed_at", "is", null)
          .in("lesson_id", lessonIds);
        for (const row of done.data ?? []) doneIds.add(String(row.lesson_id));
      }
      for (const lesson of lessons.data ?? []) {
        const slug = trackOfUnit.get(String(lesson.unit_id));
        if (!slug) continue;
        totalByTrack.set(slug, (totalByTrack.get(slug) ?? 0) + 1);
        if (doneIds.has(String(lesson.id)))
          completedByTrack.set(slug, (completedByTrack.get(slug) ?? 0) + 1);
      }
    }
    const trackSkills = new Map<string, number[]>();
    for (const row of evidence.data ?? []) {
      const slug = trackByCourse.get(String(row.skills?.courses?.id ?? ""));
      if (!slug) continue;
      const list = trackSkills.get(slug) ?? [];
      list.push(Number(row.mastery_score));
      trackSkills.set(slug, list);
    }
    const tracks = trackRows
      .filter((row: any) => row.curriculum_tracks?.slug)
      .map((row: any) => {
        const track = row.curriculum_tracks;
        const slug = String(track.slug);
        const scores = trackSkills.get(slug) ?? [];
        return {
          slug,
          subject: track.subjects?.title_en || track.subjects?.title_ar || track.subjects?.slug || "",
          title: track.title_en || track.title_ar || slug,
          contentLanguage: track.content_language === "en" ? ("en" as const) : ("ar" as const),
          completed: completedByTrack.get(slug) ?? 0,
          total: totalByTrack.get(slug) ?? 0,
          mastery: scores.length
            ? Math.round(scores.reduce((sum: number, value: number) => sum + value, 0) / scores.length)
            : undefined,
        };
      });
    return formatLearnerContext({
      displayName: profile.data?.display_name ?? "",
      xp: profile.data?.xp ?? null,
      streakDays: profile.data?.streak_days ?? null,
      courseTitle: course.data?.title_en || course.data?.title_ar || "",
      totalLessons: total.count ?? null,
      completedCount: completedCount.count ?? null,
      tracks,
      completedLessons: (progress.data ?? []).map((row: any) => ({
        title: row.lessons?.title_en || row.lessons?.title_ar || "",
        score: row.best_score,
        completedAt: row.completed_at,
      })),
      skills: (evidence.data ?? []).map((row: any) => ({
        title: row.skills?.title_en || row.skills?.title_ar || "",
        mastery: row.mastery_score,
        state: row.state,
        dueAt: row.next_review_at,
        track: trackByCourse.get(String(row.skills?.courses?.id ?? "")) ?? null,
      })),
    });
  })();
  const timeout = new Promise<string>((resolve) => setTimeout(() => resolve(""), 2500));
  return Promise.race([read.catch(() => ""), timeout]).then((context) => context || "").catch(() => "");
}
