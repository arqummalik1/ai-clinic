"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, Mic } from "lucide-react";
import { todayISO } from "@/lib/utils";
import { getBrowserApiClient } from "@/lib/infrastructure/api/client";
import { PatientRepository } from "@/lib/repositories/patientRepository";

interface DoctorStatsProps {
  initialTodayAppointments: number;
  initialTotalPrescriptions: number;
  doctorId: string;
}

export function DoctorStats({
  initialTodayAppointments,
  initialTotalPrescriptions,
  doctorId,
}: DoctorStatsProps) {
  const [stats, setStats] = useState({
    todayAppointments: initialTodayAppointments,
    totalPrescriptions: initialTotalPrescriptions,
  });

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
        console.error("[DoctorStats] Failed to load counts:", err);
      }
    };

    const supabase = getBrowserApiClient();

    // Subscribe to all changes in appointments and prescriptions for the specific doctor
    const channel = supabase
      .channel("doctor-stats-channel")
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

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="glass-card rounded-xl p-5 premium-hover border">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-brand-600">Today's appointments</p>
            <p className="text-2xl font-bold text-brand-900">{stats.todayAppointments}</p>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl p-5 premium-hover border">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 shadow-lg shadow-brand-600/30">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-brand-600">Prescriptions written</p>
            <p className="text-2xl font-bold text-brand-900">{stats.totalPrescriptions}</p>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl p-5 premium-hover border">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-medium text-red-600">Hero feature</p>
            <p className="text-sm font-semibold text-brand-900">Speak → AI prescription</p>
          </div>
        </div>
      </div>
    </div>
  );
}
