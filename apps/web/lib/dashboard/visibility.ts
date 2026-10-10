export type DashboardAvailability = {
  ownerId: string | null;
  revision: number;
  catalogReady: boolean;
  profileReady: boolean;
  evidenceReady: boolean;
  progressReady: boolean;
  notificationsReady: boolean;
};

export type DashboardAccount = {
  userId: string | null;
  revision: number;
  loading: boolean;
  error: string;
};

export function dashboardVisibility(
  snapshot: DashboardAvailability,
  account: DashboardAccount,
  dataLoading: boolean,
) {
  const current = !account.loading && !account.error && !dataLoading &&
    snapshot.ownerId === account.userId && snapshot.revision === account.revision;
  const personal = Boolean(account.userId) && current;
  return {
    current,
    waiting: account.loading || (!account.error && dataLoading),
    catalog: current && snapshot.catalogReady,
    profile: personal && snapshot.profileReady,
    evidence: personal && snapshot.evidenceReady,
    progress: personal && snapshot.catalogReady && snapshot.progressReady,
    notifications: personal && snapshot.notificationsReady,
  };
}

export function dashboardRecommendation(
  visibility: ReturnType<typeof dashboardVisibility>,
  due: number,
  lesson: { id: string; title_ar: string; title_en?: string } | null,
  locale: "ar" | "en" = "ar",
) {
  const t = (ar: string, en: string) => locale === "en" ? en : ar;
  if (visibility.evidence && due > 0) return {
    href: "/review",
    title: t("راجع اللي محتاج تثبيت","Review what needs practice"),
    description: t("عندك " + due + " مراجعات حان وقتها. المراجعة الأول هتساعدك تبني على فهم ثابت.",`${due} reviews are due. Start with a review to build on what you know.`),
    action: t("ابدأ المراجعة","Start reviewing"),
    icon: "review",
  };
  if (visibility.progress && lesson) return {
    href: "/lesson/" + encodeURIComponent(lesson.id),
    title: t("درس جديد لرحلتك","A new lesson for your journey"),
    description: t("لم يُسجّل إكمال درس «" + lesson.title_ar + "» بعد. افتحه للاطلاع على تفاصيله.",`You have not completed “${lesson.title_en || lesson.title_ar}” yet. Open it to explore the lesson.`),
    action: t("افتح الدرس","Open lesson"),
    icon: "book",
  };
  return {
    href: "/learn",
    title: t("استكشف خطوتك التالية","Explore your next step"),
    description: visibility.progress
      ? t("يمكنك استكشاف دروس أخرى أو مراجعة ما تعلمته.","Explore more lessons or review what you have learned.")
      : t("تصفّح الدروس؛ سيظهر اقتراح شخصي عندما يتأكد تحميل تقدّم حسابك.","Browse lessons. A personal suggestion will appear once your progress has loaded."),
    action: t("تصفّح الدروس","Browse lessons"),
    icon: "book",
  };
}
