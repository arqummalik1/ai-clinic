"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { MobileNav } from "./MobileNav";
import type { Role } from "./nav-config";

export function Header({ role }: { role: Role }) {
  const { profile, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav role={role} />
        <div className="flex flex-col">
          {loading ? (
            <div className="space-y-1.5">
              <div className="h-4 w-32 animate-pulse rounded bg-muted-foreground/20" />
              <div className="h-3 w-48 animate-pulse rounded bg-muted-foreground/10" />
            </div>
          ) : (
            <>
              <span className="text-sm font-medium">{profile?.full_name ?? "User"}</span>
              <span className="text-xs text-muted-foreground">{profile?.email ?? ""}</span>
            </>
          )}
        </div>
      </div>
      <Button size="sm" variant="ghost" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </header>
  );
}
