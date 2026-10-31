import { AppShell } from "@/components/app-shell";
import { DashboardLive } from "@/components/dashboard/dashboard-live";
import { HomeMarketing } from "@/components/marketing/home-marketing";

export default async function RootPage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string; view?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  if (params.view === "marketing" || params.mode === "landing") {
    return <HomeMarketing />;
  }
  return (
    <AppShell active="/">
      <DashboardLive />
    </AppShell>
  );
}
