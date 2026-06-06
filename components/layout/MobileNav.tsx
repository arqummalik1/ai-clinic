"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, type Role } from "./nav-config";

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV[role] ?? [];

  // Prevent body scroll while the drawer is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Navigation">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col bg-white shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex h-16 items-center justify-between border-b px-5">
              <span className="flex items-center gap-2 font-semibold tracking-tight">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
                  <Stethoscope className="h-4 w-4" />
                </span>
                MediSync
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary text-white font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t p-3 text-xs capitalize text-muted-foreground">
              {role.replace("_", " ")}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
