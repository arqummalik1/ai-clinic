"use client";

import { useRealtimeAppointments } from "@/hooks/useRealtime";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Mic, Calendar, FileText, Users, Activity } from "lucide-react";
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
  const timeOfDay = new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening";

  return (
    <div className="space-y-8">
      {/* Greeting - Keep as requested */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-brand-800 to-brand-900 bg-clip-text text-transparent">
          Good {timeOfDay}, Dr. {firstName}
        </h1>
        <p className="text-brand-600 mt-2 text-lg">
          {waitingPatients.length > 0 
            ? `${waitingPatients.length} patient${waitingPatients.length !== 1 ? "s" : ""} waiting`
            : "All clear for today"
          }
        </p>
      </div>

      {/* Stats Row - Clean, Balanced */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl border p-6 premium-hover">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-600">Today's Appointments</p>
              <p className="text-3xl font-bold text-brand-900">{stats.todayAppointments}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl border p-6 premium-hover">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 shadow-lg shadow-brand-600/30">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-600">Patients Waiting</p>
              <p className="text-3xl font-bold text-brand-900">{waitingPatients.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl border p-6 premium-hover">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-brand-700 to-brand-800 shadow-lg shadow-brand-700/30">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-brand-600">Total Prescriptions</p>
              <p className="text-3xl font-bold text-brand-900">{stats.totalPrescriptions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Next Patient + Start Consult - Balanced, Equal Weight */}
      {nextPatient ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Next Patient Card */}
          <div className="glass-card rounded-2xl border p-8 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br from-brand-500/10 to-brand-600/10 blur-3xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Next Patient</p>
              </div>

              <div className="flex items-center gap-6 mb-6">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-700 shadow-xl shadow-brand-500/40">
                  <span className="text-3xl font-bold text-white">#{nextPatient.token_number}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-brand-900 mb-1">
                    {nextPatient.patients?.full_name ?? "Patient"}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-brand-600">
                    <span>{nextPatient.patients?.age ?? "—"}y</span>
                    <span>•</span>
                    <span className="capitalize">{nextPatient.patients?.gender ?? "—"}</span>
                    <span>•</span>
                    <span>{nextPatient.patients?.phone ?? "—"}</span>
                  </div>
                </div>
              </div>

              {/* Vitals placeholder - for future integration */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card rounded-lg border p-3 text-center">
                  <Activity className="h-4 w-4 text-brand-500 mx-auto mb-1" />
                  <p className="text-xs text-brand-600">BP</p>
                  <p className="text-sm font-semibold text-brand-900">—</p>
                </div>
                <div className="glass-card rounded-lg border p-3 text-center">
                  <Activity className="h-4 w-4 text-brand-500 mx-auto mb-1" />
                  <p className="text-xs text-brand-600">Temp</p>
                  <p className="text-sm font-semibold text-brand-900">—</p>
                </div>
                <div className="glass-card rounded-lg border p-3 text-center">
                  <Activity className="h-4 w-4 text-brand-500 mx-auto mb-1" />
                  <p className="text-xs text-brand-600">SPO2</p>
                  <p className="text-sm font-semibold text-brand-900">—</p>
                </div>
              </div>
            </div>
          </div>

          {/* Start Consult Card - Equal size, balanced */}
          <button
            onClick={() => startConsult(nextPatient.id, nextPatient.patient_id)}
            className="glass-card rounded-2xl border p-8 relative overflow-hidden group premium-hover transition-all duration-300 hover:border-brand-400 hover:shadow-2xl hover:shadow-brand-500/20"
          >
            <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-gradient-to-br from-brand-500/10 to-brand-600/10 blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 shadow-2xl shadow-brand-500/40 group-hover:shadow-brand-500/60 group-hover:scale-105 transition-all duration-300 mb-6">
                <Mic className="h-12 w-12 text-white" />
              </div>
              
              <h3 className="text-3xl font-bold text-brand-900 mb-2">Start Consult</h3>
              <p className="text-brand-600 text-lg">Speak to prescribe</p>
              
              <div className="mt-8 flex items-center gap-2 text-sm text-brand-600">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                <span>Voice-powered prescription</span>
              </div>
            </div>
          </button>
        </div>
      ) : (
        <div className="glass-card rounded-2xl border p-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-100">
              <Users className="h-10 w-10 text-brand-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-brand-900 mb-2">All patients seen</h3>
              <p className="text-brand-600">Great work! No more patients in queue.</p>
            </div>
          </div>
        </div>
      )}

      {/* Patient Queue - Remaining patients */}
      {waitingPatients.length > 1 && (
        <div className="glass-card rounded-2xl border">
          <div className="border-b border-brand-200/50 px-8 py-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-brand-900">Upcoming Patients</h2>
            <span className="text-sm font-medium text-brand-600">
              {waitingPatients.length - 1} remaining
            </span>
          </div>
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {waitingPatients.slice(1).map((apt, index) => (
                <button
                  key={apt.id}
                  onClick={() => startConsult(apt.id, apt.patient_id)}
                  className="glass-card rounded-xl border p-6 premium-hover text-left group transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30 group-hover:shadow-brand-500/50 transition-shadow">
                      <span className="text-xl font-bold text-white">#{apt.token_number}</span>
                    </div>

                    <div className="flex-1">
                      <p className="font-bold text-brand-900 mb-1 text-lg">
                        {apt.patients?.full_name ?? "Patient"}
                      </p>
                      <p className="text-sm text-brand-600">
                        {apt.patients?.age ?? "—"}y · {apt.patients?.gender ?? "—"} · {apt.patients?.phone ?? "—"}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs font-medium text-brand-600 mb-1">Position</p>
                      <p className="text-2xl font-bold text-brand-900">{index + 2}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
