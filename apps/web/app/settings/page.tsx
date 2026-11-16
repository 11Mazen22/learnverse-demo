import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { SettingsLive } from "@/components/settings/settings-live";

export const metadata: Metadata = {
  title: "الإعدادات · Settings",
  description:
    "الهوية البصرية واللغة وتقليل الحركة وتفضيلات الحساب، محفوظة بعد تأكيد الخادم. / Visual identity, language, reduced motion, and account preferences saved after server confirmation.",
};

export default function SettingsPage() {
  return (
    <AppShell active="/settings">
      <SettingsLive />
    </AppShell>
  );
}
