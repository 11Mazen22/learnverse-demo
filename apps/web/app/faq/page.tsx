import type { Metadata } from "next";
import { FaqMarketing } from "@/components/marketing/faq-marketing";

export const metadata: Metadata = {
  title: "أسئلة شائعة · FAQ",
  description:
    "أسئلة وإجابات صريحة عن نقطة: المحتوى ومصدره، حدود المساعد الذكي، المراجعة المجدولة، اللغات، الخصوصية، والحساب المجاني.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return <FaqMarketing />;
}
