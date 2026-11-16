import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { AdminLive } from "@/components/admin/admin-live";

export const metadata: Metadata = {
  title: "مركز الإدارة · Administration",
  description:
    "إدارة المحتوى والمناهج وتذاكر الدعم والصفوف وعمليات المنصة في مساحة واحدة محمية بالصلاحيات. / Manage content, curriculum, support tickets, classes, and platform operations in one permission-gated workspace.",
};


export default function AdminPage() {
  return (
    <AppShell active="/admin" role="admin">
      <RoleGate allow={["admin"]}>
        <AdminLive />
      </RoleGate>
    </AppShell>
  );
}
