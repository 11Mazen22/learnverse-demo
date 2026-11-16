import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { RewardsLive } from "@/components/rewards/rewards-live";

export const metadata: Metadata = {
  title: "المكافآت · Rewards",
  description:
    "رصيد الجواهر وصناديق المكافآت التي تُمنح على الخادم فقط. / Your gem balance and reward boxes, minted only on the server.",
};

export default function RewardsPage() {
  return (
    <AppShell active="/rewards">
      <RewardsLive />
    </AppShell>
  );
}
