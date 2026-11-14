import { NoataAIClient } from "@/components/ai/noata-ai-client";
import { ErrorBoundary } from "@/components/ui/error-boundary";
export const metadata = { title: "Noäta AI" };
export default function NoataAIPage() {
  return (
    <ErrorBoundary
      fallbackTitleAr="تعذّر تشغيل مساحة Noäta AI"
      fallbackTitleEn="Could not render Noäta AI workspace"
    >
      <NoataAIClient />
    </ErrorBoundary>
  );
}
