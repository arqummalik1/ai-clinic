"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRealtimeAppointments } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mic, IndianRupee, XCircle, UserX, CheckCircle2, Loader2, Clock } from "lucide-react";
import { PatientTimeline, type PrescriptionEvent, type AppointmentEvent, type VitalsEvent, type FollowUpEvent } from "@/components/patients/PatientTimeline";

const STATUS_VARIANT = {
  waiting: "warning",
  in_progress: "info",
  completed: "success",
  cancelled: "destructive",
  no_show: "secondary",
} as const;

type ActionsScope = "doctor" | "reception";

export function AppointmentQueue({
  doctorId,
  showActions = true,
  showVoiceCta = false,
  actionsScope = "doctor",
}: {
  doctorId?: string;
  showActions?: boolean;
  showVoiceCta?: boolean;
  actionsScope?: ActionsScope;
}) {
  const { appointments, refresh } = useRealtimeAppointments(doctorId);
  const router = useRouter();
  const supabase = createClient();

  // Patient history dialog state
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [historyData, setHistoryData] = useState<{
    prescriptions: PrescriptionEvent[];
    appointments: AppointmentEvent[];
    vitals: VitalsEvent[];
    followUps: FollowUpEvent[];
  }>({
    prescriptions: [],
    appointments: [],
    vitals: [],
    followUps: [],
  });

  const openPatientHistory = async (patientId: string, patientName: string) => {
    setSelectedPatient({ id: patientId, name: patientName });
    setHistoryOpen(true);
    setHistoryLoading(true);

    try {
      const [rxRes, aptRes, vitRes, fuRes] = await Promise.all([
        supabase
          .from("prescriptions")
          .select("*")
          .eq("patient_id", patientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("appointments")
          .select("*")
          .eq("patient_id", patientId)
          .order("appointment_date", { ascending: false }),
        supabase
          .from("vitals")
          .select("*")
          .eq("patient_id", patientId)
          .order("recorded_at", { ascending: false }),
        supabase
          .from("follow_ups")
          .select("*")
          .eq("patient_id", patientId)
          .order("follow_up_date", { ascending: false }),
      ]);

      setHistoryData({
        prescriptions: rxRes.data || [],
        appointments: aptRes.data || [],
        vitals: vitRes.data || [],
        followUps: fuRes.data || [],
      });
    } catch (err) {
      console.error("Failed to load patient history:", err);
      toast.error("Failed to load medical history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
  };

  // One-tap "Start consult": mark in-progress AND open the voice flow, so the
  // doctor goes from queue → dictating in a single action (no Call in → Prescribe).
  const startConsult = async (id: string, patientId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("appointments").update({ status: "in_progress" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(`/doctor/voice-prescription?patientId=${patientId}&appointmentId=${id}`);
  };

  const markFeePaid = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("appointments")
      .update({ fee_paid: true })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Marked paid");
      refresh();
    }
  };

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-40 items-center justify-center text-sm text-muted-foreground">
          No appointments today.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {appointments.map((apt) => {
          const statusKey = apt.status as keyof typeof STATUS_VARIANT;
          const feePaid = (apt as unknown as { fee_paid?: boolean | null }).fee_paid;
          return (
            <div
              key={apt.id}
              className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between"
            >
              {/* Clickable patient info area */}
              <button
                onClick={() => openPatientHistory(apt.patient_id, apt.patients?.full_name ?? "Patient")}
                className="flex items-center gap-4 text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                  #{apt.token_number ?? "—"}
                </div>
                <div>
                  <p className="font-medium">{apt.patients?.full_name ?? "Patient"}</p>
                  <p className="text-xs text-muted-foreground">
                    {apt.patients?.phone ?? "no phone"} · Age {apt.patients?.age ?? "—"} ·{" "}
                    {apt.patients?.gender ?? ""}
                  </p>
                </div>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={STATUS_VARIANT[statusKey] ?? "secondary"}>
                  {apt.status.replace("_", " ")}
                </Badge>
                {actionsScope === "reception" && feePaid === false && (
                  <Badge variant="warning">Fee due</Badge>
                )}
                {actionsScope === "reception" && feePaid === true && (
                  <Badge variant="success">Paid</Badge>
                )}

                {/* Doctor-scope actions */}
                {showActions && actionsScope === "doctor" && apt.status === "waiting" && (
                  showVoiceCta ? (
                    <Button
                      size="sm"
                      className="bg-red-500 hover:bg-red-600"
                      onClick={() => startConsult(apt.id, apt.patient_id)}
                    >
                      <Mic className="mr-1 h-4 w-4" /> Start consult
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "in_progress")}>
                      Call in
                    </Button>
                  )
                )}
                {showActions && actionsScope === "doctor" && apt.status === "in_progress" && (
                  <>
                    {showVoiceCta && (
                      <Link
                        href={`/doctor/voice-prescription?patientId=${apt.patient_id}&appointmentId=${apt.id}`}
                      >
                        <Button size="sm" className="bg-red-500 hover:bg-red-600">
                          <Mic className="mr-1 h-4 w-4" /> Prescribe
                        </Button>
                      </Link>
                    )}
                    <Button size="sm" onClick={() => updateStatus(apt.id, "completed")}>
                      Done
                    </Button>
                  </>
                )}

                {/* Reception-scope actions */}
                {showActions &&
                  actionsScope === "reception" &&
                  (apt.status === "waiting" || apt.status === "in_progress") && (
                    <>
                      {feePaid === false && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markFeePaid(apt.id)}
                        >
                          <IndianRupee className="mr-1 h-3 w-3" /> Mark paid
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(apt.id, "no_show")}
                        title="Patient did not arrive"
                      >
                        <UserX className="mr-1 h-3 w-3" /> No-show
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus(apt.id, "cancelled")}
                        title="Cancel this appointment"
                      >
                        <XCircle className="mr-1 h-3 w-3 text-destructive" /> Cancel
                      </Button>
                    </>
                  )}
                {showActions &&
                  actionsScope === "reception" &&
                  apt.status === "completed" && (
                    <span className="inline-flex items-center text-xs text-muted-foreground">
                      <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-500" /> Visit complete
                    </span>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Patient History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Medical History: {selectedPatient?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Complete chronological medical journey for this patient
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm text-slate-500">Loading medical history...</p>
              </div>
            ) : (
              <PatientTimeline
                prescriptions={historyData.prescriptions}
                appointments={historyData.appointments}
                vitals={historyData.vitals}
                followUps={historyData.followUps}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
