import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["super_admin"]}>
      <DashboardShell role="super_admin">{children}</DashboardShell>
    </RoleGuard>
  );
}
