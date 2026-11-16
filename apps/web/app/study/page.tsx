import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { StudyLive } from "@/components/study/study-live";

export const metadata: Metadata = {
  title: "مركز المذاكرة · Study hub",
  description:
    "بطاقات المراجعة والتدريبات السريعة وورشة الأخطاء في مساحة مذاكرة واحدة. / Flashcards, speed drills, and the mistake workshop in one study space.",
};


export default function StudyPage() {
  return (
    <AppShell active="/study">
      <StudyLive />
    </AppShell>
  );
}
