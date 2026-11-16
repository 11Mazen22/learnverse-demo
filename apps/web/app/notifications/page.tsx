import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { NotificationsLive } from "@/components/notifications/notifications-live";

export const metadata: Metadata = {
  title: "الإشعارات · Notifications",
  description:
    "تنبيهات حسابك الدراسية وتحديثات الواجبات والمراجعة في مكان واحد. / Your academic alerts, assignment updates, and review reminders in one place.",
};

export default function NotificationsPage() {
  return (
    <AppShell active="/notifications">
      <NotificationsLive />
    </AppShell>
  );
}
