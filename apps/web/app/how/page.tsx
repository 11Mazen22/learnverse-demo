import type { Metadata } from "next";
import { HowMarketing } from "@/components/marketing/how-marketing";

export const metadata: Metadata = {
  title: "طريقة التعلم في نقطة · دورة الإتقان من الفهم إلى التكرار المتباعد",
  description:
    "تعرف على دورة التعلم في نقطة: من المصدر الموثوق والشرح المتدرج إلى التطبيق الفوري والمراجعة المجدولة بخوارزمية SM-2.",
};

export default function HowPage() {
  return <HowMarketing />;
}
