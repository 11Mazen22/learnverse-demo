import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ReviewLive } from "@/components/review/review-live";

export const metadata: Metadata = {
  title: "المراجعة المتباعدة · Spaced review",
  description:
    "جدول المراجعة المتباعدة القائم على نتائج المحاولات والبطاقات المحفوظة. / Spaced review scheduling driven by recorded attempts and saved flashcards.",
};

export default function ReviewPage() {
  return (
    <AppShell active="/review">
      <ReviewLive />
    </AppShell>
  );
}
