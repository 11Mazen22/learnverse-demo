import { NoataAIClient } from "@/components/ai/noata-ai-client";
export const metadata = { title: "Noata AI" };

export default function NoataAIPage() {
  return (
    <main id="noata-main" tabIndex={-1}>
      <NoataAIClient />
    </main>
  );
}
