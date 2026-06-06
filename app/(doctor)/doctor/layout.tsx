import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["doctor"]}>
      <DashboardShell role="doctor">{children}</DashboardShell>
    </RoleGuard>
  );
}
