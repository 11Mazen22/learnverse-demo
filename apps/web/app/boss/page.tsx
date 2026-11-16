import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BossLive } from "@/components/boss/boss-live";

export const metadata: Metadata = {
  title: "معركة الوحدة · Unit boss",
  description:
    "معركة نهاية الوحدة بتصحيح على الخادم ومكافأة لا تُمنح إلا بعد التحقق. / End-of-unit boss runs with server-side grading and rewards granted only after verification.",
};

export default function BossPage() {
  return (
    <AppShell active="/boss">
      <BossLive />
    </AppShell>
  );
}
