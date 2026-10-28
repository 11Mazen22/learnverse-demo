import { AppShell } from "@/components/app-shell";
import { DashboardLive } from "@/components/dashboard/dashboard-live";
import { HomeMarketing } from "@/components/marketing/home-marketing";
import { createClient } from "@/lib/supabase/server";

/** A signed-in visitor gets their dashboard; everyone else gets the public site.
 *  The session probe is bounded so a slow auth service can never hang the page. */
async function currentUserId(): Promise<string | null> {
  try {
    const client = await createClient();
    const probe = client.auth.getUser();
    const timer = new Promise<never>((_, reject) =>
      setTimeout(() => reject(Error("session probe timeout")), 4000),
    );
    const result = await Promise.race([probe, timer]);
    return result.data.user?.id ?? null;
  } catch {
    return null;
  }
}

export default async function RootPage() {
  const userId = await currentUserId();
  if (!userId) return <HomeMarketing />;
  return (
    <AppShell active="/">
      <DashboardLive />
    </AppShell>
  );
}
