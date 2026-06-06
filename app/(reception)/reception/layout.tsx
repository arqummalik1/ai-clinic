import { RoleGuard } from "@/components/layout/RoleGuard";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function ReceptionLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allow={["receptionist"]}>
      <DashboardShell role="receptionist">{children}</DashboardShell>
    </RoleGuard>
  );
}
