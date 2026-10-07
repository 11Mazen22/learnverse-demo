import {AppShell} from "@/components/app-shell";
import {RoleGate} from "@/components/auth/role-gate";
import {TeacherLive} from "@/components/teacher/teacher-live";

export default function TeacherPage(){
  return <AppShell active="/teacher" role="teacher"><RoleGate allow={["teacher","admin"]}><TeacherLive/></RoleGate></AppShell>;
}
