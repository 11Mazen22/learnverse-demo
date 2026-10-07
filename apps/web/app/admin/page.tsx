import {AppShell} from "@/components/app-shell";
import {RoleGate} from "@/components/auth/role-gate";
import {AdminLive} from "@/components/admin/admin-live";

export default function AdminPage(){
  return <AppShell active="/admin" role="admin"><RoleGate allow={["admin"]}><AdminLive/></RoleGate></AppShell>;
}
