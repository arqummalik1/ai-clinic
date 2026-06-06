import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic, AlertTriangle, Activity } from "lucide-react";
import { PatientTimeline } from "@/components/patients/PatientTimeline";

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: patient } = await supabase.from("patients").select("*").eq("id", id).single();
  if (!patient) notFound();

  // Fetch prescriptions with all fields, including clinical summaries & raw transcription
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("id, diagnosis, chief_complaint, medicines, lab_tests, advice, pdf_url, is_ai_generated, raw_voice_text, clinical_summary, transcription_language, created_at")
    .eq("patient_id", id)
    .order("created_at", { ascending: false });

  // Fetch appointments (visits)
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id, appointment_date, status, consultation_fee, notes")
    .eq("patient_id", id)
    .order("appointment_date", { ascending: false })
    .limit(20);

  // Fetch patient vitals & observations
  const { data: vitals } = await supabase
    .from("patient_vitals")
    .select("id, bp_systolic, bp_diastolic, weight_kg, temperature_f, pulse_rate, spo2, recorded_at")
    .eq("patient_id", id)
    .order("recorded_at", { ascending: false });

  // Fetch follow up reminders
  const { data: followUps } = await supabase
    .from("follow_ups")
    .select("id, follow_up_date, notified, notification_channel, custom_message, notes, created_at")
    .eq("patient_id", id)
    .order("follow_up_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/doctor/patients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground animate-in fade-in duration-300">
          <ArrowLeft className="h-4 w-4" /> Back to Patient List
        </Link>
        <Link href={`/doctor/voice-prescription?patientId=${patient.id}`}>
          <Button className="bg-red-500 hover:bg-red-600 transition-all hover:scale-[1.02] shadow-sm">
            <Mic className="mr-2 h-4 w-4" /> Voice prescribe
          </Button>
        </Link>
      </div>

      <Card className="border-slate-100 shadow-sm bg-gradient-to-r from-slate-50 to-white">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{patient.full_name}</h1>
            <span className="text-xs text-slate-400 font-mono">ID: {patient.id.slice(0, 8)}...</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div>
              <span className="text-slate-400">Age:</span> <strong className="text-slate-600">{patient.age ?? "—"}</strong>
            </div>
            <span>·</span>
            <div>
              <span className="text-slate-400">Gender:</span> <strong className="text-slate-600 capitalize">{patient.gender ?? "—"}</strong>
            </div>
            <span>·</span>
            <div>
              <span className="text-slate-400">Phone:</span> <strong className="text-slate-600">{patient.phone ?? "—"}</strong>
            </div>
            <span>·</span>
            <div>
              <span className="text-slate-400">Email:</span> <strong className="text-slate-600">{patient.email ?? "—"}</strong>
            </div>
          </div>
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800 border border-yellow-100 max-w-2xl">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <div>
                <span className="font-semibold">Allergies:</span> {patient.allergies.join(", ")}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <Activity className="h-5 w-5 text-indigo-500" /> Patient Medical Journey & Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="px-1 md:px-6">
          <PatientTimeline
            prescriptions={prescriptions || []}
            appointments={appointments || []}
            vitals={vitals || []}
            followUps={followUps || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
