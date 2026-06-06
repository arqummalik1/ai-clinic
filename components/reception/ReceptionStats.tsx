"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, UserPlus } from "lucide-react";
import { todayISO } from "@/lib/utils";
import { getBrowserApiClient } from "@/lib/infrastructure/api/client";
import { PatientRepository } from "@/lib/repositories/patientRepository";

interface ReceptionStatsProps {
  initialTodayAppointments: number;
  initialPatientCount: number;
  clinicId: string;
}

export function ReceptionStats({
  initialTodayAppointments,
  initialPatientCount,
  clinicId,
}: ReceptionStatsProps) {
  const [stats, setStats] = useState({
    todayAppointments: initialTodayAppointments,
    patientCount: initialPatientCount,
  });

  useEffect(() => {
    const repository = new PatientRepository();
    
    const fetchCounts = async () => {
      try {
        const today = todayISO();
        const data = await repository.getReceptionStats(clinicId, today);
        setStats({
          todayAppointments: data.todayAppointments,
          patientCount: data.patientCount,
        });
      } catch (err) {
        console.error("[ReceptionStats] Failed to load counts:", err);
      }
    };

    const supabase = getBrowserApiClient();
    
    // Subscribe to all changes in appointments and patients for the specific clinic
    const channel = supabase
      .channel("reception-stats-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `clinic_id=eq.${clinicId}` },
        () => {
          fetchCounts();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients", filter: `clinic_id=eq.${clinicId}` },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clinicId]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
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
          <div className="rounded-lg bg-emerald-100 p-3">
            <UserPlus className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total patients</p>
            <p className="text-2xl font-semibold">{stats.patientCount}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
