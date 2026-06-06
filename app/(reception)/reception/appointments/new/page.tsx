import { Suspense } from "react";
import { NewAppointmentForm } from "./NewAppointmentForm";

export default function NewAppointmentPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New appointment</h1>
        <p className="text-sm text-muted-foreground">Allocate a token and collect the consultation fee</p>
      </div>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-secondary" />}>
        <NewAppointmentForm />
      </Suspense>
    </div>
  );
}
