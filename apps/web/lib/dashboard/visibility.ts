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
  lesson: { id: string; title_ar: string } | null,
) {
  if (visibility.evidence && due > 0) return {
    href: "/review",
    title: "راجع اللي محتاج تثبيت",
    description: "عندك " + due + " مراجعات حان وقتها. المراجعة الأول هتساعدك تبني على فهم ثابت.",
    action: "ابدأ المراجعة",
    icon: "review",
  };
  if (visibility.progress && lesson) return {
    href: "/lesson/" + encodeURIComponent(lesson.id),
    title: "درس جديد لرحلتك",
    description: "لم يُسجّل إكمال درس «" + lesson.title_ar + "» بعد. افتحه للاطلاع على تفاصيله.",
    action: "افتح الدرس",
    icon: "book",
  };
  return {
    href: "/learn",
    title: "استكشف خطوتك التالية",
    description: visibility.progress
      ? "يمكنك استكشاف دروس أخرى أو مراجعة ما تعلمته."
      : "تصفّح الدروس؛ سيظهر اقتراح شخصي عندما يتأكد تحميل تقدّم حسابك.",
    action: "تصفّح الدروس",
    icon: "book",
  };
}
