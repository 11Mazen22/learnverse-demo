import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { HelpCenterLive } from "@/components/help/help-center-live";

export const metadata: Metadata = {
  title: "مركز المساعدة والدعم الفني | Noäta Aura",
  description: "Comprehensive Help Center, guides for the 6 core subjects and 8 independent tracks, spaced repetition workflows, and direct support.",
};

export default function HelpPage() {
  return (
    <MarketingShell tone="dark">
      <HelpCenterLive />
    </MarketingShell>
  );
}
