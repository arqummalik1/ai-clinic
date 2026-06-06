import { Suspense } from "react";
import { VoicePrescriptionFlow } from "./VoicePrescriptionFlow";

interface PageProps {
  searchParams: Promise<{
    patientId?: string;
    appointmentId?: string;
  }>;
}

export default async function VoicePrescriptionPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const patientId = resolvedParams.patientId;
  const appointmentId = resolvedParams.appointmentId;
  

  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-secondary" />}>
      <VoicePrescriptionFlow patientId={patientId} appointmentId={appointmentId} />
    </Suspense>
  );
}
