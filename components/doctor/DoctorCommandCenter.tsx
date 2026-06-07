"use client";

import { useRealtimeAppointments } from "@/hooks/useRealtime";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mic, Calendar, FileText, TrendingUp, Clock, User, Phone } from "lucide-react";
import { EarningsChart } from "@/components/earnings/EarningsChart";
import { useEffect, useState } from "react";
import { getBrowserApiClient } from "@/lib/infrastructure/api/client";
import { PatientRepository } from "@/lib/repositories/patientRepository";
import { todayISO } from "@/lib/utils";

interface DoctorCommandCenterProps {
  doctorId: string;
  doctorName: string;
  initialTodayAppointments: number;
  initialTotalPrescriptions: number;
  canViewEarnings: boolean;
}

export function DoctorCommandCenter({
  doctorId,
  doctorName,
  initialTodayAppointments,
  initialTotalPrescriptions,
  canViewEarnings,
}: DoctorCommandCenterProps) {
  const { appointments, refresh } = useRealtimeAppointments(doctorId);
  const router = useRouter();
  const [stats, setStats] = useState({
    todayAppointments: initialTodayAppointments,
    totalPrescriptions: initialTotalPrescriptions,
  });

  // Real-time stats updates
  useEffect(() => {
    const repository = new PatientRepository();

    const fetchCounts = async () => {
      try {
        const today = todayISO();
        const data = await repository.getDoctorStats(doctorId, today);
        setStats({
          todayAppointments: data.todayAppointments,
          totalPrescriptions: data.totalPrescriptions,
        });
      } catch (err) {
        console.error("[DoctorCommandCenter] Failed to load counts:", err);
      }
    };

    const supabase = getBrowserApiClient();

    const channel = supabase
      .channel("doctor-command-center-stats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `doctor_id=eq.${doctorId}` },
        () => {
          fetchCounts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "prescriptions", filter: `doctor_id=eq.${doctorId}` },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId]);

  const startConsult = async (id: string, patientId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("appointments").update({ status: "in_progress" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push(`/doctor/voice-prescription?patientId=${patientId}&appointmentId=${id}`);
  };

  const waitingPatients = appointments.filter((apt) => apt.status === "waiting");
  const nextPatient = waitingPatients[0];
  const firstName = doctorName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Hero Section - Voice Prescription CTA + Next Patient */}
      <div className="glass-card rounded-2xl border p-8 relative overflow-hidden">
        {/* Background gradient orb */}
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-gradient-to-br from-red-500/20 to-red-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-600/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-800 to-brand-900 bg-clip-text text-transparent">
                Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, Dr. {firstName}
              </h1>
              <p className="text-brand-600 mt-2">
                {waitingPatients.length > 0 
                  ? `${waitingPatients.length} patient${waitingPatients.length !== 1 ? "s" : ""} waiting`
                  : "No patients waiting"
                }
              </p>
            </div>

            {/* Quick stats - compact, glanceable */}
            <div className="flex gap-4">
              <div className="glass-card rounded-xl border px-4 py-3 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-brand-600" />
                  <p className="text-2xl font-bold text-brand-900">{stats.todayAppointments}</p>
                </div>
                <p className="text-xs text-brand-600">Today</p>
              </div>
              <div className="glass-card rounded-xl border px-4 py-3 text-center min-w-[100px]">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <p className="text-2xl font-bold text-brand-900">{stats.totalPrescriptions}</p>
                </div>
                <p className="text-xs text-brand-600">Total Rx</p>
              </div>
            </div>
          </div>

          {/* Next Patient Card + Voice CTA */}
          {nextPatient ? (
            <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center">
              {/* Next patient info */}
              <div className="glass-card rounded-xl border p-6 bg-white/80">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide">Next Patient</p>
                </div>
                <div className="flex items-center gap-5">
                  {/* Token Badge */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 shadow-lg shadow-brand-500/40">
                    <span className="text-2xl font-bold text-white">#{nextPatient.token_number}</span>
                  </div>

                  {/* Patient Details */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-brand-900 mb-1">
                      {nextPatient.patients?.full_name ?? "Patient"}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-brand-600">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {nextPatient.patients?.age ?? "—"}y · {nextPatient.patients?.gender ?? "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {nextPatient.patients?.phone ?? "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Giant Voice Prescribe Button */}
              <button
                onClick={() => startConsult(nextPatient.id, nextPatient.patient_id)}
                className="group relative h-full min-h-[180px] lg:min-h-full lg:w-64 rounded-xl bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-2xl shadow-red-500/40 hover:shadow-red-500/60 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border-0 overflow-hidden"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/20" />
                
                <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 p-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                    <Mic className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white mb-1">Start Consult</p>
                    <p className="text-sm text-white/90">Speak to prescribe</p>
                  </div>
                </div>

                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-xl border-2 border-white/30 animate-pulse" />
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-xl border p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100">
                  <Clock className="h-10 w-10 text-brand-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-brand-900 mb-2">All clear!</h3>
                  <p className="text-brand-600">No patients waiting. Take a breather.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient Queue + Earnings */}
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Remaining Queue */}
        <div className="glass-card rounded-xl border">
          <div className="border-b border-brand-200/50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-900">Patient Queue</h2>
            <span className="text-sm font-medium text-brand-600">
              {waitingPatients.length} waiting
            </span>
          </div>
          <div className="p-6">
            {waitingPatients.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-brand-600">Queue is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingPatients.slice(1).map((apt, index) => (
                  <button
                    key={apt.id}
                    onClick={() => startConsult(apt.id, apt.patient_id)}
                    className="w-full glass-card rounded-lg border p-4 premium-hover text-left group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Token */}
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/30 group-hover:shadow-lg group-hover:shadow-brand-500/40 transition-shadow">
                        <span className="text-lg font-bold text-white">#{apt.token_number}</span>
                      </div>

                      {/* Patient info */}
                      <div className="flex-1">
                        <p className="font-semibold text-brand-900 mb-0.5">
                          {apt.patients?.full_name ?? "Patient"}
                        </p>
                        <p className="text-xs text-brand-600">
                          {apt.patients?.age ?? "—"}y · {apt.patients?.gender ?? "—"} · {apt.patients?.phone ?? "—"}
                        </p>
                      </div>

                      {/* Position indicator */}
                      <div className="text-right">
                        <p className="text-xs font-medium text-brand-600">Position</p>
                        <p className="text-2xl font-bold text-brand-900">{index + 2}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Earnings - passive info column */}
        {canViewEarnings && (
          <div className="space-y-4">
            <EarningsChart doctorId={doctorId} />
          </div>
        )}
      </div>
    </div>
  );
}
