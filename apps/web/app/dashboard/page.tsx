import { AppShell } from "@/components/app-shell";
import { DashboardLive } from "@/components/dashboard/dashboard-live";

export const metadata = {
  title: "لوحة التحكم · Dashboard",
  description: "مساحة التعلّم اليومية ومنظومة الإتقان لمنصة Noäta.",
};

export default function DashboardPage() {
  return (
    <AppShell active="/">
      <DashboardLive />
    </AppShell>
  );
}
