import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ProgressLive } from "@/components/progress/progress-live";

export const metadata: Metadata = {
  title: "تقدّمي · Progress",
  description:
    "أدلة المهارة وسجل المحاولات والتقدّم الفعلي المحفوظ في حسابك. / Skill evidence, attempt history, and real progress stored in your account.",
};

export default function ProgressPage() {
  return (
    <AppShell active="/progress">
      <ProgressLive />
    </AppShell>
  );
}
