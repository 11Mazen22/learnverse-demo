export type ShellRole = "student" | "teacher" | "admin";
export type EffectiveRole = ShellRole | "guest";

export type ShellRouteMeta = {
  href: string;
  labelAr: string;
  labelEn: string;
  icon: string;
  descriptionAr: string;
  descriptionEn: string;
  group: "primary" | "learning" | "tools" | "progress" | "staff" | "utilities";
  roles?: readonly ShellRole[];
  keywords?: readonly string[];
};

export type CommandAction = {
  id: string;
  category: "recent" | "quick" | "navigation" | "subjects" | "preferences";
  labelAr: string;
  labelEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  href?: string;
  effect?: "toggle-theme" | "toggle-locale" | "toggle-sidebar";
  shortcut?: string;
  keywords: readonly string[];
};

export const CORE_CURRICULUM_SUBJECTS = [
  {
    key: "integrated-science",
    slug: "integrated-science",
    titleAr: "العلوم المتكاملة",
    titleEn: "Integrated Science",
    shortTitleAr: "علوم",
    shortTitleEn: "Science",
    accent: "cyan",
    icon: "microscope",
    dualLanguage: true,
    tracks: [
      { slug: "ar", labelAr: "المسار العربي", labelEn: "Arabic Track" },
      { slug: "en", labelAr: "المسار الإنجليزي", labelEn: "English Track" },
    ],
  },
  {
    key: "mathematics",
    slug: "mathematics",
    titleAr: "الرياضيات",
    titleEn: "Mathematics",
    shortTitleAr: "رياضيات",
    shortTitleEn: "Math",
    accent: "indigo",
    icon: "compass",
    dualLanguage: true,
    tracks: [
      { slug: "ar", labelAr: "المسار العربي", labelEn: "Arabic Track" },
      { slug: "en", labelAr: "المسار الإنجليزي", labelEn: "English Track" },
    ],
  },
  {
    key: "history",
    slug: "history",
    titleAr: "تاريخ",
    titleEn: "History",
    shortTitleAr: "تاريخ",
    shortTitleEn: "History",
    accent: "amber",
    icon: "landmark",
    dualLanguage: false,
    tracks: [],
  },
  {
    key: "arabic-language",
    slug: "arabic-language",
    titleAr: "اللغة العربية",
    titleEn: "Arabic Language",
    shortTitleAr: "عربي",
    shortTitleEn: "Arabic",
    accent: "rose",
    icon: "feather",
    dualLanguage: false,
    tracks: [],
  },
  {
    key: "english",
    slug: "english",
    titleAr: "اللغة الإنجليزية",
    titleEn: "English Language",
    shortTitleAr: "إنجليزي",
    shortTitleEn: "English",
    accent: "teal",
    icon: "globe",
    dualLanguage: false,
    tracks: [],
  },
  {
    key: "philosophy-logic",
    slug: "philosophy-logic",
    titleAr: "الفلسفة والمنطق",
    titleEn: "Philosophy & Logic",
    shortTitleAr: "فلسفة",
    shortTitleEn: "Philosophy",
    accent: "violet",
    icon: "lightbulb",
    dualLanguage: false,
    tracks: [],
  },
] as const;

export const SHELL_ROUTES: readonly ShellRouteMeta[] = [
  {
    href: "/",
    labelAr: "الرئيسية",
    labelEn: "Home",
    icon: "home",
    descriptionAr: "مساحتك اليومية ومتابعة الأهداف",
    descriptionEn: "Your daily overview and goals",
    group: "primary",
    keywords: ["home", "dashboard", "overview", "الرئيسية", "لوحتي"],
  },
  {
    href: "/ai",
    labelAr: "Noäta AI",
    labelEn: "Noäta AI",
    icon: "ai",
    descriptionAr: "رفيق المذاكرة وورشة التعلّم",
    descriptionEn: "Smart study companion & studio",
    group: "primary",
    keywords: ["ai", "assistant", "chat", "ذكاء", "نقطة"],
  },
  {
    href: "/learn",
    labelAr: "رحلة التعلّم",
    labelEn: "Learning Paths",
    icon: "book",
    descriptionAr: "خارطة المحتوى والوحدات المنشورة",
    descriptionEn: "Published content roadmap & units",
    group: "learning",
    keywords: ["learn", "curriculum", "subjects", "دروس", "مناهج"],
  },
  {
    href: "/missions",
    labelAr: "المهام اليومية",
    labelEn: "Missions",
    icon: "target",
    descriptionAr: "تحديات قصيرة وتثبيت فوري",
    descriptionEn: "Short daily challenges",
    group: "learning",
    keywords: ["missions", "daily", "challenges", "مهام"],
  },
  {
    href: "/review",
    labelAr: "المراجعة الذكية",
    labelEn: "Smart Review",
    icon: "review",
    descriptionAr: "تكرار متباعد وتثبيت المفاهيم",
    descriptionEn: "Spaced repetition & concept practice",
    group: "learning",
    keywords: ["review", "mistakes", "skills", "مراجعة"],
  },
  {
    href: "/study",
    labelAr: "مركز المذاكرة",
    labelEn: "Study Center",
    icon: "clipboard",
    descriptionAr: "استوديو المذاكرة الذكي وبطاقات 3D",
    descriptionEn: "Smart study studio, quizzes & 3D flashcards",
    group: "learning",
    keywords: ["study", "flashcards", "cloze", "quiz", "بطاقات", "مذاكرة"],
  },
  {
    href: "/boss",
    labelAr: "تحدّي الوحدة",
    labelEn: "Unit Challenge",
    icon: "boss",
    descriptionAr: "اختبار إتقان شامل ومحاكاة",
    descriptionEn: "Comprehensive mastery assessment",
    group: "learning",
    keywords: ["boss", "exam", "mastery", "تحدي"],
  },
  {
    href: "/quran",
    labelAr: "المصحف الشريف",
    labelEn: "Noble Quran",
    icon: "book",
    descriptionAr: "آيات موثّقة وتلاوة صوتية",
    descriptionEn: "Verified verses & recitation",
    group: "tools",
    keywords: ["quran", "mushaf", "مصحف", "قرآن"],
  },
  {
    href: "/assignments",
    labelAr: "الواجبات الدراسية",
    labelEn: "Assignments",
    icon: "check",
    descriptionAr: "مهام معلّمك واختبارات المتابعة",
    descriptionEn: "Assigned tasks from teachers",
    group: "tools",
    keywords: ["assignments", "homework", "واجبات"],
  },
  {
    href: "/progress",
    labelAr: "تقدّمي وإحصائياتي",
    labelEn: "My Progress",
    icon: "chart",
    descriptionAr: "معدل الإتقان والنمو المستمر",
    descriptionEn: "Mastery metrics & analytics",
    group: "progress",
    keywords: ["progress", "analytics", "mastery", "تقدمي"],
  },
  {
    href: "/rewards",
    labelAr: "المكافآت والمظاهر",
    labelEn: "Rewards & Cosmetics",
    icon: "gift",
    descriptionAr: "احتفل بنقاط تميزك ومحطات إتقانك",
    descriptionEn: "Celebrate milestones & rewards",
    group: "progress",
    keywords: ["rewards", "shop", "coins", "مكافآت"],
  },
  {
    href: "/notifications",
    labelAr: "الإشعارات",
    labelEn: "Notifications",
    icon: "bell",
    descriptionAr: "التنبيهات والتحديثات الدراسية",
    descriptionEn: "Study alerts & updates",
    group: "utilities",
    keywords: ["notifications", "alerts", "إشعارات"],
  },
  {
    href: "/teacher",
    labelAr: "مساحة المعلّم",
    labelEn: "Teacher Workspace",
    icon: "user",
    descriptionAr: "إدارة الفصول والواجبات والتقييم",
    descriptionEn: "Manage classes, assignments & grading",
    group: "staff",
    roles: ["teacher", "admin"],
    keywords: ["teacher", "classes", "grading", "معلم", "فصول"],
  },
  {
    href: "/admin",
    labelAr: "إدارة Noäta",
    labelEn: "Manage Noäta",
    icon: "shield",
    descriptionAr: "لوحة العمليات والمناهج والصلاحيات",
    descriptionEn: "Platform administration & operations",
    group: "staff",
    roles: ["admin"],
    keywords: ["admin", "operations", "curriculum", "إدارة"],
  },
  {
    href: "/settings",
    labelAr: "الإعدادات والمظهر",
    labelEn: "Settings & Theme",
    icon: "settings",
    descriptionAr: "تخصيص كامل للألوان والتجربة",
    descriptionEn: "Full theme & experience control",
    group: "utilities",
    keywords: ["settings", "theme", "design", "palette", "إعدادات", "مظهر"],
  },
  {
    href: "/help",
    labelAr: "مركز المساعدة",
    labelEn: "Help Center",
    icon: "help",
    descriptionAr: "إرشادات ودعم مستمر",
    descriptionEn: "Guidance and support",
    group: "utilities",
    keywords: ["help", "support", "faq", "مساعدة", "دعم"],
  },
] as const;

export function getEffectiveRole(
  accountRole: ShellRole | null | undefined,
  hasUser: boolean,
  fallbackRole: ShellRole = "student"
): EffectiveRole {
  if (!hasUser) return "guest";
  return accountRole ?? fallbackRole;
}

export function isRouteAllowedForRole(route: ShellRouteMeta, role: EffectiveRole): boolean {
  if (!route.roles) return true;
  if (role === "guest") return false;
  return route.roles.includes(role);
}

export function getWorkspaceLabel(
  shellRole: ShellRole,
  effectiveRole: EffectiveRole,
  locale: "ar" | "en"
): { spaceAr: string; spaceEn: string; badgeAr: string; badgeEn: string; label: string } {
  const space =
    shellRole === "teacher"
      ? { ar: "مساحة المعلّم", en: "Teacher workspace" }
      : shellRole === "admin"
        ? { ar: "مساحة الإدارة", en: "Admin workspace" }
        : { ar: "مساحتي التعليمية", en: "My learning space" };

  const badge =
    effectiveRole === "admin"
      ? { ar: "مشرف", en: "Admin" }
      : effectiveRole === "teacher"
        ? { ar: "معلّم", en: "Teacher" }
        : effectiveRole === "student"
          ? { ar: "طالب", en: "Student" }
          : { ar: "معاينة", en: "Guest" };

  return {
    spaceAr: space.ar,
    spaceEn: space.en,
    badgeAr: badge.ar,
    badgeEn: badge.en,
    label: locale === "en" ? space.en : space.ar,
  };
}

export function getMobileDockRoutes(effectiveRole: EffectiveRole): ShellRouteMeta[] {
  const wantedHrefs =
    effectiveRole === "admin"
      ? ["/", "/admin", "/teacher", "/ai"]
      : effectiveRole === "teacher"
        ? ["/", "/teacher", "/assignments", "/ai"]
        : ["/", "/learn", "/ai", "/progress"];

  return wantedHrefs
    .map((href) => SHELL_ROUTES.find((r) => r.href === href))
    .filter((r): r is ShellRouteMeta => Boolean(r));
}

export function resolvePageTitle(
  active: string,
  shellRole: ShellRole,
  locale: "ar" | "en"
): string {
  if (active.startsWith("/lesson")) {
    return locale === "en" ? "Interactive Lesson" : "الدرس التفاعلي";
  }
  const exact = SHELL_ROUTES.find((r) => r.href === active);
  if (exact) return locale === "en" ? exact.labelEn : exact.labelAr;
  const ws = getWorkspaceLabel(shellRole, shellRole, locale);
  return ws.label;
}

/** Resolve the representative SVG icon name for the active shell route. */
export function resolveRouteIcon(active: string): string {
  if (active.startsWith("/lesson")) return "book";
  const exact = SHELL_ROUTES.find((r) => r.href === active);
  if (exact) return exact.icon;
  return "compass";
}

export function buildCommandActions({
  effectiveRole,
  recentHrefs = [],
  currentTheme = "light",
  locale = "ar",
}: {
  effectiveRole: EffectiveRole;
  recentHrefs?: readonly string[];
  currentTheme?: "light" | "dark";
  locale?: "ar" | "en";
}): CommandAction[] {
  const permittedRoutes = SHELL_ROUTES.filter((r) => isRouteAllowedForRole(r, effectiveRole));
  const actions: CommandAction[] = [];

  for (const href of recentHrefs.slice(0, 4)) {
    const match = permittedRoutes.find((r) => r.href === href);
    if (!match) continue;
    actions.push({
      id: `recent:${match.href}`,
      category: "recent",
      href: match.href,
      labelAr: match.labelAr,
      labelEn: match.labelEn,
      descriptionAr: match.descriptionAr,
      descriptionEn: match.descriptionEn,
      icon: match.icon,
      keywords: [...(match.keywords ?? []), match.labelAr, match.labelEn],
    });
  }

  // Quick learning & productivity actions
  actions.push(
    {
      id: "quick:srs-review",
      category: "quick",
      href: "/study?mode=srs",
      labelAr: "ابدأ جلسة تكرار متباعد",
      labelEn: "Start Spaced Repetition Session",
      descriptionAr: "مراجعة البطاقات المستحقة اليوم",
      descriptionEn: "Review flashcards due now",
      icon: "review",
      keywords: ["due", "srs", "flashcards", "مراجعة", "بطاقات"],
    },
    {
      id: "quick:new-deck",
      category: "quick",
      href: "/study?action=new",
      labelAr: "إنشاء مجموعة بطاقات جديدة",
      labelEn: "Create New Study Deck",
      descriptionAr: "إضافة بطاقات وشروحات ومعادلات",
      descriptionEn: "Create flashcards with formulas & cloze",
      icon: "clipboard",
      keywords: ["new deck", "create", "flashcard", "جديدة", "مجموعة"],
    },
    {
      id: "quick:ai-studio",
      category: "quick",
      href: "/ai",
      labelAr: "اسأل Noäta AI",
      labelEn: "Ask Noäta AI",
      descriptionAr: "شرح درس أو تلخيص أو خطة مذاكرة",
      descriptionEn: "Explain a concept, summarize or plan",
      icon: "ai",
      keywords: ["ai", "ask", "explain", "اسأل"],
    }
  );

  if (effectiveRole === "teacher" || effectiveRole === "admin") {
    actions.push({
      id: "quick:teacher-assign",
      category: "quick",
      href: "/teacher",
      labelAr: "إدارة الواجبات والفصول",
      labelEn: "Manage Assignments & Classes",
      descriptionAr: "إنشاء واجب أو تصحيح تسليمات الطلاب",
      descriptionEn: "Build assignments or grade student work",
      icon: "user",
      keywords: ["teacher", "assignment", "grade", "واجب", "فصل"],
    });
  }
  if (effectiveRole === "admin") {
    actions.push({
      id: "quick:admin-ops",
      category: "quick",
      href: "/admin",
      labelAr: "لوحة إدارة المنصة",
      labelEn: "Platform Admin Console",
      descriptionAr: "إدارة المناهج والحسابات وسجل العمليات",
      descriptionEn: "Curriculum, user roles & audit operations",
      icon: "shield",
      keywords: ["admin", "audit", "operations", "إدارة"],
    });
  }

  for (const r of permittedRoutes) {
    actions.push({
      id: `nav:${r.href}`,
      category: "navigation",
      href: r.href,
      labelAr: r.labelAr,
      labelEn: r.labelEn,
      descriptionAr: r.descriptionAr,
      descriptionEn: r.descriptionEn,
      icon: r.icon,
      keywords: [...(r.keywords ?? []), r.labelAr, r.labelEn, r.href],
    });
  }

  for (const sub of CORE_CURRICULUM_SUBJECTS) {
    actions.push({
      id: `sub:${sub.slug}`,
      category: "subjects",
      href: `/learn?subject=${sub.slug}`,
      labelAr: sub.titleAr,
      labelEn: sub.titleEn,
      descriptionAr: sub.dualLanguage ? "مسار عربي + مسار إنجليزي" : "منهج الصف الأول الثانوي",
      descriptionEn: sub.dualLanguage ? "Arabic & English tracks" : "Published curriculum track",
      icon: sub.icon,
      keywords: [sub.slug, sub.titleAr, sub.titleEn, sub.shortTitleAr, sub.shortTitleEn],
    });
  }

  // Instant workspace preferences
  actions.push(
    {
      id: "pref:theme",
      category: "preferences",
      effect: "toggle-theme",
      labelAr: currentTheme === "dark" ? "التبديل إلى الوضع النهاري" : "التبديل إلى الوضع الليلي",
      labelEn: currentTheme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode",
      descriptionAr: "تغيير المظهر فورًا دون مغادرة الصفحة",
      descriptionEn: "Switch appearance immediately without leaving this page",
      icon: currentTheme === "dark" ? "sun" : "moon",
      keywords: ["theme", "dark", "light", "مظهر", "ليلي", "نهاري"],
    },
    {
      id: "pref:locale",
      category: "preferences",
      effect: "toggle-locale",
      labelAr: locale === "ar" ? "التبديل إلى الإنجليزية (English)" : "التبديل إلى العربية",
      labelEn: locale === "en" ? "Switch Language to Arabic (العربية)" : "Switch Language to English",
      descriptionAr: "تبديل اتجاه ولغة واجهة المنصة فورًا",
      descriptionEn: "Flip interface language & RTL/LTR direction",
      icon: "globe",
      keywords: ["language", "arabic", "english", "rtl", "ltr", "لغة", "عربي", "إنجليزي"],
    },
    {
      id: "pref:design-studio",
      category: "preferences",
      href: "/settings#appearance",
      labelAr: "استوديو الألوان والتصميم",
      labelEn: "Design Studio & Palettes",
      descriptionAr: "اختيار لوحة ألوان أو إنشاء ثيم مخصص بالذكاء",
      descriptionEn: "Pick a built-in palette or craft an AI custom theme",
      icon: "sparkles",
      keywords: ["palette", "design", "colors", "ألوأن", "ثيم"],
    }
  );

  return actions;
}

const RECENT_STORAGE_PREFIX = "noata_recent_routes_v1";

export function recentRoutesStorageKey(userId: string | null | undefined): string {
  return `${RECENT_STORAGE_PREFIX}:${userId ?? "guest"}`;
}

export function pushRecentDestination(
  list: readonly string[],
  href: string,
  maxItems = 5
): string[] {
  const cleaned = href.split("#")[0];
  if (!cleaned.startsWith("/") || cleaned === "/login" || cleaned === "/signup") {
    return [...list];
  }
  return [cleaned, ...list.filter((item) => item !== cleaned)].slice(0, maxItems);
}
