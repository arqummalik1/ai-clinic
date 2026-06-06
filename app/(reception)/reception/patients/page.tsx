import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PatientList } from "@/components/patients/PatientList";
import { UserPlus } from "lucide-react";

export default function ReceptionPatientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">Search or register patients</p>
        </div>
        <Link href="/reception/patients/new">
          <Button><UserPlus className="mr-2 h-4 w-4" /> New patient</Button>
        </Link>
      </div>
      <PatientList basePath="/reception/patients" />
    </div>
  );
}
