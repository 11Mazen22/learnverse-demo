import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { LearnLive } from "@/components/learn/learn-live";

export const metadata: Metadata = {
  title: "استكشاف المنهج · Curriculum explorer",
  description:
    "استكشف المواد والمسارات والدروس المنشورة في منهج الصف الأول الثانوي. / Explore published subjects, tracks, and lessons across the First Secondary curriculum.",
};


export default function LearnPage() {
  return (
    <AppShell active="/learn">
      <LearnLive />
    </AppShell>
  );
}
