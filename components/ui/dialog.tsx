"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DialogContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}
const Ctx = React.createContext<DialogContextValue | null>(null);

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={{ open, setOpen: onOpenChange }}>{children}</Ctx.Provider>;
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(Ctx);
  if (!ctx?.open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={() => ctx.setOpen(false)}
    >
      <div
        className={cn("relative w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => ctx.setOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4 flex flex-col space-y-1.5", className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>;
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mt-6 flex justify-end gap-2", className)}>{children}</div>;
}
