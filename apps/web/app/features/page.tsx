import type { Metadata } from "next";
import { FeaturesMarketing } from "@/components/marketing/features-marketing";

export const metadata: Metadata = {
  title: "المزايا وكيف تعمل · Features & How it works",
  description:
    "كيف تعمل نقطة: ست خطوات من أول درس إلى الإتقان، رحلة تعلم كاملة، مراجعة مجدولة، مساعد Noäta AI بأنماط دراسية، ومنهج الصف الأول الثانوي الترم الأول في ست مواد.",
  alternates: { canonical: "/features" },
};

export default function FeaturesPage() {
  return <FeaturesMarketing />;
}
