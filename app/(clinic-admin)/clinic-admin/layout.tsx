import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ClinicAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["clinic_admin"]}>
      <DashboardShell role="clinic_admin">{children}</DashboardShell>
    </RoleGuard>
  );
}
