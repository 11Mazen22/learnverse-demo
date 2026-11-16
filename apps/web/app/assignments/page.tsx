import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { AssignmentsLive } from "@/components/assignments/assignments-live";

export const metadata: Metadata = {
  title: "الواجبات · Assignments",
  description:
    "واجباتك النشطة مع حفظ تلقائي للمسودات وتقديم موثّق على الخادم. / Your active assignments with draft checkpointing and server-verified submission.",
};

export default function AssignmentsPage() {
  return (
    <AppShell active="/assignments">
      <AssignmentsLive />
    </AppShell>
  );
}
