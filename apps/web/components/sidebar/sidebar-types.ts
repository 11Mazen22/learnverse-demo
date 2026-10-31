export type RouteTuple = [
  ar: string,
  en: string,
  href: string,
  icon: string,
  arDescription: string,
  enDescription: string,
];

export type NavGroupConfig = {
  id: string;
  titleAr: string;
  titleEn: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  routes: RouteTuple[];
};

export type CurriculumSubjectNav = {
  key: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  shortTitleAr: string;
  shortTitleEn: string;
  accent: string;
  icon: string;
  dualLanguage?: boolean;
  tracks?: {
    slug: string;
    labelAr: string;
    labelEn: string;
    badge: string;
  }[];
};
