import { PatientForm } from "@/components/patients/PatientForm";
import { PATHS } from "@/lib/constants";

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Register patient</h1>
        <p className="text-sm text-muted-foreground">Capture demographics and optional vitals</p>
      </div>
      <PatientForm redirectAfter={PATHS.DOCTOR_PATIENTS} />
    </div>
  );
}
