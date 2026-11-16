import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { RoleGate } from "@/components/auth/role-gate";
import { TeacherLive } from "@/components/teacher/teacher-live";

export const metadata: Metadata = {
  title: "مساحة المعلم · Teacher workspace",
  description:
    "إدارة الصفوف والواجبات والروبريكس والإعلانات للطلاب المسجلين. / Classroom, assignment, rubric, and announcement management for enrolled students.",
};


export default function TeacherPage() {
  return (
    <AppShell active="/teacher" role="teacher">
      <RoleGate allow={["teacher", "admin"]}>
        <TeacherLive />
      </RoleGate>
    </AppShell>
  );
}
