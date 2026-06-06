import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { PatientList } from "@/components/patients/PatientList";

export default function DoctorPatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">Patients you&apos;ve treated</p>
        </div>
        <Link href="/doctor/patients/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> New patient
          </Button>
        </Link>
      </div>
      <PatientList basePath="/doctor/patients" />
    </div>
  );
}
