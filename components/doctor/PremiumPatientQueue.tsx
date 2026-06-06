"use client";

import { User, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  full_name: string;
  appointment_id?: string;
  token_number?: number | null;
}

interface PremiumPatientQueueProps {
  patients: Patient[];
  onSelectPatient: (patientId: string, appointmentId?: string) => void;
}

export function PremiumPatientQueue({ patients, onSelectPatient }: PremiumPatientQueueProps) {
  if (patients.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No patients waiting</h3>
          <p className="mt-1 text-sm text-slate-500">Your queue is empty for today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with clear instruction */}
      <div className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Your patient queue (FIFO)</h3>
            <p className="mt-1 text-sm text-slate-600">
              Click on any patient below to start consultation • First patient appears first
            </p>
          </div>
        </div>
      </div>

      {/* Patient list - FIFO order, premium Apple-like design */}
      <div className="space-y-2">
        {patients.map((patient, index) => (
          <button
            key={patient.appointment_id ?? patient.id}
            onClick={() => onSelectPatient(patient.id, patient.appointment_id)}
            className={cn(
              "group relative w-full rounded-xl border-2 bg-white p-5 text-left transition-all duration-200",
              "hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100/50",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
              "active:scale-[0.98]",
              index === 0
                ? "border-blue-200 bg-blue-50/30" // Highlight first patient
                : "border-slate-200 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-4">
              {/* Token number badge */}
              <div
                className={cn(
                  "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl font-bold transition-all",
                  index === 0
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200"
                    : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
                )}
              >
                <span className="text-xl">#{patient.token_number ?? "—"}</span>
              </div>

              {/* Patient info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="truncate text-lg font-semibold text-slate-900">
                    {patient.full_name}
                  </h4>
                  {index === 0 && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      Next
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">
                  {index === 0 ? "Ready for consultation" : `Position ${index + 1} in queue`}
                </p>
              </div>

              {/* Arrow indicator */}
              <ChevronRight
                className={cn(
                  "h-6 w-6 flex-shrink-0 transition-all",
                  index === 0
                    ? "text-blue-600"
                    : "text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600"
                )}
              />
            </div>

            {/* Subtle hover glow effect */}
            <div
              className={cn(
                "pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200",
                "bg-gradient-to-r from-blue-500/5 to-indigo-500/5",
                "group-hover:opacity-100"
              )}
            />
          </button>
        ))}
      </div>

      {/* Queue summary */}
      <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
        <p className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{patients.length}</span>{" "}
          {patients.length === 1 ? "patient" : "patients"} waiting • Click to start consultation
        </p>
      </div>
    </div>
  );
}
