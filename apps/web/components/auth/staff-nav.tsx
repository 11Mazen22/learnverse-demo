"use client";

import { useVerifiedAccount } from "@/lib/supabase/use-verified-account";
import { localized, useLocale } from "@/lib/i18n/locale";
import { SidebarGroup } from "@/components/sidebar/sidebar-group";
import { SidebarItem } from "@/components/sidebar/sidebar-item";

type StaffNavProps = {
  active: string;
  isCollapsed?: boolean;
  onNavigate?: (href: string) => void;
};

export function StaffNav({
  active,
  isCollapsed = false,
  onNavigate,
}: StaffNavProps) {
  const locale = useLocale();
  const t = (ar: string, en: string) => localized(locale, ar, en);
  const account = useVerifiedAccount();
  const role = account.role;

  if (
    !account.user ||
    account.loading ||
    account.profileLoading ||
    account.profileError ||
    !role ||
    role === "student"
  )
    return null;

  const isStaffActive = active === "/teacher" || active === "/admin";

  return (
    <SidebarGroup
      id="staff-workspaces"
      titleAr="مساحات العمل الخاصة"
      titleEn="Staff Workspaces"
      icon="shield"
      badge={role === "admin" ? t("إدارة", "Admin") : t("معلّم", "Teacher")}
      collapsible={true}
      defaultExpanded={true}
      hasActiveChild={isStaffActive}
      isCollapsedSidebar={isCollapsed}
    >
      <SidebarItem
        href="/teacher"
        icon="user"
        labelAr="مساحة المعلّم"
        labelEn="Teacher Workspace"
        descriptionAr="إدارة الفصول والواجبات والمتابعة"
        descriptionEn="Class management & student oversight"
        isActive={active === "/teacher"}
        isCollapsed={isCollapsed}
        tag={t("تعليمي", "Staff")}
        tagVariant="warning"
        onClick={() => onNavigate?.("/teacher")}
      />

      {role === "admin" && (
        <SidebarItem
          href="/admin"
          icon="shield"
          labelAr="إدارة Noäta"
          labelEn="Manage Noäta"
          descriptionAr="لوحة العمليات والتحكم المركزي"
          descriptionEn="Platform administration & systems"
          isActive={active === "/admin"}
          isCollapsed={isCollapsed}
          tag={t("مشرف", "Admin")}
          tagVariant="warning"
          onClick={() => onNavigate?.("/admin")}
        />
      )}
    </SidebarGroup>
  );
}
