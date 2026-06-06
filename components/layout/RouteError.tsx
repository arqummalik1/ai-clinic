"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable error-boundary UI for App Router `error.tsx` files.
 * Keeps a consistent, friendly failure state across the app.
 */
export function RouteError({
  error,
  reset,
  title = "Something went wrong",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    // Surface the error for observability without leaking it to the UI.
    console.error("[RouteError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while loading this page. You can try again, and if
        it keeps happening, contact your administrator.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/70">Reference: {error.digest}</p>
      )}
      <Button onClick={reset} className="mt-6 gap-2">
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </div>
  );
}
