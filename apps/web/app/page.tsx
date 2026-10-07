import { AppShell } from "@/components/app-shell";
import { DashboardLive } from "@/components/dashboard/dashboard-live";

export default function HomePage() {
  return (
    <AppShell active="/">
      <DashboardLive />
    </AppShell>
  );
}
