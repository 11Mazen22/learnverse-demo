import { AppShell } from "@/components/app-shell";
import { LessonLive } from "@/components/learn/lesson-live";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AppShell active="/learn">
      <LessonLive id={id} />
    </AppShell>
  );
}
