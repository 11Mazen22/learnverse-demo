import { AppShell } from "@/components/app-shell";
import { MissionLive } from "@/components/missions/mission-live";

export default function MissionsPage() {
  return (
    <AppShell active="/missions">
      <MissionLive />
    </AppShell>
  );
}
