import { AppShell } from "@/components/app-shell";
import { StudyLive } from "@/components/study/study-live";

export default function StudyPage() {
  return (
    <AppShell active="/study">
      <StudyLive />
    </AppShell>
  );
}
