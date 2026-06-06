import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

export default async function ReceptionPatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!patient) notFound();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, appointment_date, status, token_number, consultation_fee, fee_paid, users!doctor_id(full_name)")
    .eq("patient_id", id)
    .order("appointment_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/reception/patients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Link href={`/reception/appointments/new?patientId=${patient.id}`}>
          <Button><Calendar className="mr-2 h-4 w-4" /> New appointment</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="space-y-2 p-6">
          <h1 className="text-2xl font-semibold">{patient.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            Age {patient.age ?? "—"} · {patient.gender ?? "—"} · {patient.phone ?? "—"} · {patient.email ?? "no email"}
          </p>
          {patient.allergies && patient.allergies.length > 0 && (
            <p className="text-sm text-yellow-700">⚠ {patient.allergies.join(", ")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Doctor</th>
                <th className="px-4 py-3 text-left">Token</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Fee</th>
              </tr>
            </thead>
            <tbody>
              {(appointments ?? []).map((a) => {
                const d = (a as { users?: { full_name?: string } | { full_name?: string }[] }).users;
                const docName = Array.isArray(d) ? d[0]?.full_name : d?.full_name;
                return (
                  <tr key={a.id} className="border-b">
                    <td className="px-4 py-3">{a.appointment_date}</td>
                    <td className="px-4 py-3">Dr. {docName ?? "—"}</td>
                    <td className="px-4 py-3">#{a.token_number}</td>
                    <td className="px-4 py-3 capitalize">{a.status.replace("_", " ")}</td>
                    <td className="px-4 py-3 text-right">{a.consultation_fee ? `₹${a.consultation_fee}` : "—"}</td>
                  </tr>
                );
              })}
              {(!appointments || appointments.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No appointments yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
