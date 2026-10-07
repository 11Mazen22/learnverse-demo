import { AppShell } from "@/components/app-shell";
import { RewardsLive } from "@/components/rewards/rewards-live";
export default function RewardsPage() {
  return (
    <AppShell active="/rewards">
      <RewardsLive />
    </AppShell>
  );
}
