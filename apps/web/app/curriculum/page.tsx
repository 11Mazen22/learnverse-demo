import type { Metadata } from "next";
import { CurriculumMarketing } from "@/components/marketing/curriculum-marketing";

export const metadata: Metadata = {
  title: "المنهج والمسارات الدراسية (أولى ثانوي) · الترم الأول 2026–2027",
  description:
    "استكشف منهج الصف الأول الثانوي كاملاً في ست مواد دراسية وثمانية مسارات مستقلة مع دروس متدرجة وبنك أسئلة حقيقي مع التصحيح وتوضيح المغالطات.",
};

export default function CurriculumPage() {
  return <CurriculumMarketing />;
}
