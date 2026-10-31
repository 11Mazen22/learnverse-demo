export type TourRole = "student" | "teacher" | "admin";

export type TourStep = {
  id: string;
  targetSelector?: string; // CSS selector of element to highlight
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  tipAr?: string;
  tipEn?: string;
  actionHref?: string; // Optional deep link
  placement?: "top" | "bottom" | "left" | "right" | "center";
};

export type TourDefinition = {
  id: string;
  role?: TourRole | "all";
  pageRoute?: string; // e.g. "/dashboard", "/study", etc.
  version: number;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  steps: TourStep[];
};

export type TourProgress = {
  status: "not_started" | "in_progress" | "completed" | "skipped";
  stepIndex: number;
  version: number;
  updatedAt: string;
  dontShowAgain?: boolean;
};

export type TourStateMap = Record<string, TourProgress>;
