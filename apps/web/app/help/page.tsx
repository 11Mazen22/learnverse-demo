import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { HelpCenterLive } from "@/components/help/help-center-live";

export const metadata: Metadata = {
  title: "مركز المساعدة والدعم | Noäta",
  description:
    "مركز مساعدة Noäta: أدلة المنهج والمسارات، التكرار المتباعد، المساعد الذكي، وتذكرة دعم مباشرة مع كود متابعة. / Noäta Help Center: curriculum and track guides, spaced review, the AI companion, and direct support tickets with a tracking code.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <AppShell active="/help">
      {/* One cohesive Help Center: the legacy aura panel used to render stacked
          above this modern surface, producing duplicated heroes and search. */}
      <HelpCenterLive />
    </AppShell>
  );
}
