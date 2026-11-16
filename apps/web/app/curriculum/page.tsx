import type { Metadata } from "next";
import { CurriculumMarketing } from "@/components/marketing/curriculum-marketing";

export const metadata: Metadata = {
  title: "المنهج والمسارات الدراسية · Curriculum & Tracks",
  description:
    "منهج الصف الأول الثانوي في ست عائلات مواد وثمانية مسارات مستقلة، مع دروس متدرجة وبنك أسئلة وتصحيح معلّل لكل مسار. / First Secondary curriculum across six subject families and eight independent tracks, with stepped lessons, question banks, and reasoned correction per track.",
  alternates: { canonical: "/curriculum" },
};

export default function CurriculumPage() {
  return <CurriculumMarketing />;
}
