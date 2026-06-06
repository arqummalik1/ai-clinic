import {
  LayoutDashboard, Users, Calendar, FileText, Mic, BarChart3,
  Bell, ShieldCheck, Building2, Settings,
} from "lucide-react";

export type Role = "super_admin" | "clinic_admin" | "doctor" | "receptionist";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV: Record<Role, NavItem[]> = {
  super_admin: [
    { href: "/super-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/super-admin/clinics", label: "Clinics", icon: Building2 },
    { href: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/super-admin/settings", label: "Settings", icon: Settings },
  ],
  clinic_admin: [
    { href: "/clinic-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/clinic-admin/users", label: "Staff", icon: Users },
    { href: "/clinic-admin/permissions", label: "Permissions", icon: ShieldCheck },
    { href: "/clinic-admin/earnings", label: "Earnings", icon: BarChart3 },
    { href: "/clinic-admin/settings", label: "Settings", icon: Settings },
  ],
  doctor: [
    { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/voice-prescription", label: "Voice Prescribe", icon: Mic },
    { href: "/doctor/patients", label: "Patients", icon: Users },
    { href: "/doctor/prescriptions", label: "Prescriptions", icon: FileText },
    { href: "/doctor/follow-ups", label: "Follow-ups", icon: Bell },
    { href: "/doctor/earnings", label: "Earnings", icon: BarChart3 },
    { href: "/doctor/settings", label: "Settings", icon: Settings },
  ],
  receptionist: [
    { href: "/reception/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/reception/patients", label: "Patients", icon: Users },
    { href: "/reception/appointments", label: "Appointments", icon: Calendar },
    { href: "/reception/follow-ups", label: "Follow-ups", icon: Bell },
    { href: "/reception/settings", label: "Settings", icon: Settings },
  ],
};
