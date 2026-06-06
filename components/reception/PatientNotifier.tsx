"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { getBrowserApiClient } from "@/lib/infrastructure/api/client";

export function PatientNotifier() {
  useEffect(() => {
    const supabase = getBrowserApiClient();

    const handlePatientInsert = async (payload: { new: { full_name: string; created_by: string | null } }) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // Skip if the current receptionist registered this patient
        if (user && payload.new.created_by === user.id) {
          return;
        }

        if (payload.new.created_by) {
          // Fetch creator role and name
          const { data: creator } = await supabase
            .from("users")
            .select("full_name, role")
            .eq("id", payload.new.created_by)
            .single();

          if (creator && creator.role === "doctor") {
            toast.info(`Patient "${payload.new.full_name}" registered by Dr. ${creator.full_name}`, {
              duration: 5000,
              position: "top-right",
            });
          }
        }
      } catch (err) {
        console.error("[PatientNotifier] Error processing real-time notification:", err);
      }
    };

    const channel = supabase
      .channel("reception-patient-notifier")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "patients" },
        (payload) => {
          const patientData = payload.new as { full_name?: string; created_by?: string | null };
          handlePatientInsert({ 
            new: { 
              full_name: patientData.full_name || "Unknown Patient", 
              created_by: patientData.created_by || null 
            } 
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null; // This is a headless logic component
}
