import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { MissionLive } from "@/components/missions/mission-live";

export const metadata: Metadata = {
  title: "المهام · Missions",
  description:
    "مهام يومية وأسبوعية تُحتسب على الخادم ولا تمنح تقدّمًا بدون دليل. / Daily and weekly missions scored on the server, never granting progress without evidence.",
};


export default function MissionsPage() {
  return (
    <AppShell active="/missions">
      <MissionLive />
    </AppShell>
  );
}
