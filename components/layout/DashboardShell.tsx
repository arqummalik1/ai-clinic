import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import type { Role } from "./nav-config";

export function DashboardShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar role={role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header role={role} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
