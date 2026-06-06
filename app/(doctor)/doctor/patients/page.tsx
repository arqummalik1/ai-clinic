import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { PatientList } from "@/components/patients/PatientList";

export default function DoctorPatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-800 to-brand-900 bg-clip-text text-transparent">
            Patients
          </h1>
          <p className="text-sm text-brand-600 mt-1">Patients you've treated</p>
        </div>
        <Link href="/doctor/patients/new">
          <Button className="bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 shadow-md shadow-brand-500/30">
            <UserPlus className="mr-2 h-4 w-4" /> New patient
          </Button>
        </Link>
      </div>
      <PatientList basePath="/doctor/patients" />
    </div>
  );
}
