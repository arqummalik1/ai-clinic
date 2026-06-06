"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, type Role } from "./nav-config";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV[role] ?? [];

  return (
    <aside className="hidden md:flex w-60 flex-col glass-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-brand-200/50 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 text-white shadow-md shadow-brand-500/30">
          <Stethoscope className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight bg-gradient-to-r from-brand-700 to-brand-900 bg-clip-text text-transparent">MediSync</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active 
                  ? "glass-nav-active text-white font-semibold" 
                  : "text-brand-700 glass-nav-hover border border-transparent",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-brand-200/50 p-3 text-xs text-brand-600 font-medium">
        <UserCog className="mr-1 inline h-3 w-3" /> {role.replace("_", " ")}
      </div>
    </aside>
  );
}
