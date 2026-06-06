"use client";

import Link from "next/link";
import { useRealtimeAppointments } from "@/hooks/useRealtime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mic, IndianRupee, XCircle, UserX, CheckCircle2 } from "lucide-react";

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

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else refresh();
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
    <div className="space-y-2">
      {appointments.map((apt) => {
        const statusKey = apt.status as keyof typeof STATUS_VARIANT;
        const feePaid = (apt as unknown as { fee_paid?: boolean | null }).fee_paid;
        return (
          <div
            key={apt.id}
            className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between"
          >
            <div className="flex items-center gap-4">
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
            </div>
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
                <Button size="sm" variant="outline" onClick={() => updateStatus(apt.id, "in_progress")}>
                  Call in
                </Button>
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
  );
}
