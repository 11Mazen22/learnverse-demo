import type { Metadata } from "next";
import { AboutMarketing } from "@/components/marketing/about-marketing";

export const metadata: Metadata = {
  title: "عن نقطة · About Noata",
  description:
    "لماذا وُجدت نقطة: فلسفة تعلم تقوم على الفهم والتطبيق والاسترجاع والمراجعة الموزعة، ودور واضح وصرّاح للذكاء الاصطناعي. About Noata: a learning philosophy of understanding, practice, retrieval and spaced review.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return <AboutMarketing />;
}
