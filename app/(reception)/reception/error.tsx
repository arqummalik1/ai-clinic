"use client";

import { RouteError } from "@/components/layout/RouteError";

export default function ReceptionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError error={error} reset={reset} title="Couldn't load this page" />;
}
