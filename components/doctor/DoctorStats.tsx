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
      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="rounded-lg bg-blue-100 p-3">
            <Calendar className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Today&apos;s appointments</p>
            <p className="text-2xl font-semibold">{stats.todayAppointments}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="rounded-lg bg-purple-100 p-3">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Prescriptions written</p>
            <p className="text-2xl font-semibold">{stats.totalPrescriptions}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-5">
          <div className="rounded-lg bg-red-100 p-3">
            <Mic className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Hero feature</p>
            <p className="text-sm font-medium">Speak → AI prescription</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
