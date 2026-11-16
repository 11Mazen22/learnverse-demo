import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DashboardLive } from "@/components/dashboard/dashboard-live";
import { HomeMarketing } from "@/components/marketing/home-marketing";

export const metadata: Metadata = {
  title: "لوحة التعلّم · Learning dashboard",
  description:
    "لوحة تعلّم Noäta: خطوتك التالية، خريطة نقاط الضعف، سلسلة المذاكرة، والتقدّم المحفوظ في حسابك. / Your Noäta dashboard: next action, weak-skill radar, study streak, and progress saved to your account.",
};


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
