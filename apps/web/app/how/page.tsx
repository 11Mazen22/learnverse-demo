import type { Metadata } from "next";
import { HowMarketing } from "@/components/marketing/how-marketing";

export const metadata: Metadata = {
  title: "طريقة التعلّم · How Noäta Works",
  description:
    "دورة التعلّم في Noäta: من المصدر الموثّق والشرح المتدرّج إلى التطبيق الفوري والمراجعة المجدولة بخوارزمية SM-2. / The Noäta learning loop: recorded provenance, stepped explanations, immediate practice, and SM-2 spaced review.",
  alternates: { canonical: "/how" },
};

export default function HowPage() {
  return <HowMarketing />;
}
