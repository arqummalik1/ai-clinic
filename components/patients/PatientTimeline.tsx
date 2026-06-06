"use client";

import { useState } from "react";
import { 
  FileText, 
  Calendar, 
  Activity, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Mic, 
  Sparkles,
  Pill,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyINR } from "@/lib/utils";

interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PrescriptionEvent {
  id: string;
  diagnosis: string;
  chief_complaint?: string | null;
  medicines?: Medicine[] | null;
  lab_tests?: string[] | null;
  advice?: string | null;
  pdf_url?: string | null;
  is_ai_generated?: boolean;
  raw_voice_text?: string | null;
  clinical_summary?: string | null;
  transcription_language?: string | null;
  created_at: string;
}

export interface AppointmentEvent {
  id: string;
  appointment_date: string;
  status: string;
  consultation_fee?: string | number | null;
  notes?: string | null;
}

export interface VitalsEvent {
  id: string;
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  weight_kg?: string | number | null;
  temperature_f?: string | number | null;
  pulse_rate?: number | null;
  spo2?: number | null;
  recorded_at: string;
}

export interface FollowUpEvent {
  id: string;
  follow_up_date: string;
  notified?: boolean;
  notification_channel?: string | null;
  custom_message?: string | null;
  notes?: string | null;
  created_at: string;
}

interface Props {
  prescriptions: PrescriptionEvent[];
  appointments: AppointmentEvent[];
  vitals: VitalsEvent[];
  followUps: FollowUpEvent[];
}

type TimelineItem = 
  | { type: "prescription"; date: string; payload: PrescriptionEvent }
  | { type: "appointment"; date: string; payload: AppointmentEvent }
  | { type: "vitals"; date: string; payload: VitalsEvent }
  | { type: "follow_up"; date: string; payload: FollowUpEvent };

export function PatientTimeline({ prescriptions, appointments, vitals, followUps }: Props) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Compile and sort all events chronologically (newest first)
  const timeline: TimelineItem[] = [];

  prescriptions.forEach(p => {
    timeline.push({ type: "prescription", date: p.created_at, payload: p });
  });

  appointments.forEach(a => {
    // Appointment date doesn't have time, so let's set a late time to group it correctly
    const dateStr = `${a.appointment_date}T10:00:00.000Z`;
    timeline.push({ type: "appointment", date: dateStr, payload: a });
  });

  vitals.forEach(v => {
    timeline.push({ type: "vitals", date: v.recorded_at, payload: v });
  });

  followUps.forEach(f => {
    // Follow-ups have a date only, let's treat it similarly
    const dateStr = `${f.follow_up_date}T09:00:00.000Z`;
    timeline.push({ type: "follow_up", date: dateStr, payload: f });
  });

  // Sort: descending order
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
          <Calendar className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-sm font-semibold text-slate-900">No medical history</h3>
        <p className="mt-1 text-sm text-slate-500">There are no records in this patient&apos;s medical timeline yet.</p>
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-200 ml-4 md:ml-6 space-y-6 pb-8">
      {timeline.map((item) => {
        const itemKey = `${item.type}-${item.payload.id}`;
        const isExpanded = !!expandedItems[itemKey];
        const displayDate = new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        // 1. Prescription Card
        if (item.type === "prescription") {
          const rxData = item.payload;
          return (
            <div key={itemKey} className="relative pl-8 group">
              {/* Dot Icon */}
              <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                <FileText className="h-4 w-4" />
              </div>

              <Card className="border-emerald-100/60 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-4 md:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Prescription</span>
                        {rxData.is_ai_generated && (
                          <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 font-medium text-[10px] gap-1 flex items-center">
                            <Sparkles className="h-2.5 w-2.5" /> AI Assisted
                          </Badge>
                        )}
                        <span className="text-xs text-slate-400">{displayDate}</span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-800">
                        Diagnosis: {rxData.diagnosis || "No diagnosis specified"}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      {rxData.pdf_url && (
                        <a href={rxData.pdf_url} target="_blank" rel="noreferrer">
                          <Button variant="outline" size="sm" className="h-8 text-emerald-700 border-emerald-200 hover:bg-emerald-50/50">
                            <ExternalLink className="mr-1 h-3 w-3" /> View PDF
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(itemKey)}
                        className="h-8 px-2 text-slate-500"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Collapsible details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                      {rxData.chief_complaint && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1">Chief Complaint</span>
                          <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">{rxData.chief_complaint}</p>
                        </div>
                      )}

                      {rxData.medicines && rxData.medicines.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                            <Pill className="h-4 w-4 text-emerald-500" /> Prescribed Medicines
                          </span>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {rxData.medicines.map((med, i) => (
                              <div key={i} className="rounded-lg border border-slate-100 bg-white p-3 space-y-1">
                                <div className="font-medium text-slate-800">{med.name}</div>
                                <div className="text-xs text-slate-500 flex flex-wrap gap-x-2">
                                  <span>Dosage: <strong className="text-slate-700">{med.dosage}</strong></span>
                                  <span>·</span>
                                  <span>Freq: <strong className="text-slate-700">{med.frequency}</strong></span>
                                  <span>·</span>
                                  <span>Duration: <strong className="text-slate-700">{med.duration}</strong></span>
                                </div>
                                {med.instructions && (
                                  <div className="text-xs text-slate-600 bg-emerald-50/30 px-2 py-1 rounded border border-emerald-100/30 mt-1 italic">
                                    {med.instructions}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {rxData.lab_tests && rxData.lab_tests.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1">Recommended Lab Tests</span>
                          <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                            {rxData.lab_tests.map((test, i) => (
                              <li key={i}>{test}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {rxData.advice && (
                        <div>
                          <span className="font-semibold text-slate-700 block mb-1">Advice & Instructions</span>
                          <p className="text-slate-600 italic">{rxData.advice}</p>
                        </div>
                      )}

                      {/* original transcription & clinical summary */}
                      {(rxData.raw_voice_text || rxData.clinical_summary) && (
                        <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                              <Mic className="h-3 w-3" /> Voice Record Details
                            </span>
                            {rxData.transcription_language && (
                              <span className="text-[10px] text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded uppercase font-medium">
                                Lang: {rxData.transcription_language}
                              </span>
                            )}
                          </div>

                          {rxData.clinical_summary && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-indigo-900 flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-indigo-500" /> Internal Clinical Summary (AI)
                              </span>
                              <p className="text-slate-700 leading-relaxed text-xs pl-4 border-l border-indigo-200">
                                {rxData.clinical_summary}
                              </p>
                            </div>
                          )}

                          {rxData.raw_voice_text && (
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-slate-500">Original Voice Transcript</span>
                              <p className="text-slate-600 text-xs italic bg-white/70 p-2 rounded-lg border border-slate-100 font-mono">
                                &ldquo;{rxData.raw_voice_text}&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

        // 2. Appointment Card
        if (item.type === "appointment") {
          const aptData = item.payload;
          return (
            <div key={itemKey} className="relative pl-8 group">
              {/* Dot Icon */}
              <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-indigo-100">
                <Calendar className="h-4 w-4" />
              </div>

              <Card className="border-indigo-100/60 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Clinic Visit</span>
                      <span className="text-xs text-slate-400">{displayDate}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      Visit Status: 
                      <span className={`capitalize px-2 py-0.5 rounded text-xs font-medium ${
                        aptData.status === "completed" 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : aptData.status === "cancelled" 
                            ? "bg-red-50 text-red-700 border border-red-200" 
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {aptData.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {aptData.consultation_fee && (
                      <div>
                        <span className="text-xs text-slate-400 block">Fee Paid</span>
                        <strong className="text-slate-700">{formatCurrencyINR(Number(aptData.consultation_fee))}</strong>
                      </div>
                    )}
                    {aptData.notes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(itemKey)}
                        className="h-8 px-2 text-slate-500"
                      >
                        Notes {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                      </Button>
                    )}
                  </div>

                  {isExpanded && aptData.notes && (
                    <div className="w-full mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 animate-in fade-in slide-in-from-top-1 duration-200">
                      <strong>Visit Notes:</strong> {aptData.notes}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

        // 3. Vitals Card
        if (item.type === "vitals") {
          const vitalsData = item.payload;
          return (
            <div key={itemKey} className="relative pl-8 group">
              {/* Dot Icon */}
              <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 transition-colors group-hover:bg-rose-100">
                <Activity className="h-4 w-4" />
              </div>

              <Card className="border-rose-100/60 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-4 md:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">Vitals & Observations</span>
                    <span className="text-xs text-slate-400">{displayDate}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {vitalsData.bp_systolic && vitalsData.bp_diastolic && (
                      <div className="rounded-lg bg-rose-50/30 border border-rose-100/20 p-2.5 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Blood Pressure</span>
                        <strong className="text-sm text-slate-800">{vitalsData.bp_systolic}/{vitalsData.bp_diastolic} <span className="text-xs text-slate-400 font-normal">mmHg</span></strong>
                      </div>
                    )}
                    {vitalsData.temperature_f && (
                      <div className="rounded-lg bg-rose-50/30 border border-rose-100/20 p-2.5 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Temperature</span>
                        <strong className="text-sm text-slate-800">{vitalsData.temperature_f}°F</strong>
                      </div>
                    )}
                    {vitalsData.pulse_rate && (
                      <div className="rounded-lg bg-rose-50/30 border border-rose-100/20 p-2.5 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Pulse Rate</span>
                        <strong className="text-sm text-slate-800">{vitalsData.pulse_rate} <span className="text-xs text-slate-400 font-normal">bpm</span></strong>
                      </div>
                    )}
                    {vitalsData.spo2 && (
                      <div className="rounded-lg bg-rose-50/30 border border-rose-100/20 p-2.5 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Oxygen (SpO2)</span>
                        <strong className="text-sm text-slate-800">{vitalsData.spo2}%</strong>
                      </div>
                    )}
                    {vitalsData.weight_kg && (
                      <div className="rounded-lg bg-rose-50/30 border border-rose-100/20 p-2.5 text-center">
                        <span className="text-[10px] text-slate-500 block uppercase font-medium">Weight</span>
                        <strong className="text-sm text-slate-800">{vitalsData.weight_kg} kg</strong>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }

        // 4. Follow Up Card
        if (item.type === "follow_up") {
          const fuData = item.payload;
          return (
            <div key={itemKey} className="relative pl-8 group">
              {/* Dot Icon */}
              <div className="absolute -left-[17px] top-1.5 flex h-8 w-8 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                <Clock className="h-4 w-4" />
              </div>

              <Card className="border-amber-100/60 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Follow-up Scheduled</span>
                      <span className="text-xs text-slate-400">Created: {displayDate}</span>
                    </div>
                    <h5 className="text-sm font-semibold text-slate-800">
                      Scheduled Date: {new Date(fuData.follow_up_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </h5>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-400 block">Status</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${fuData.notified ? "text-green-600" : "text-amber-600"}`}>
                        {fuData.notified ? "Reminded" : "Pending"}
                      </span>
                    </div>
                    {fuData.notification_channel && (
                      <div>
                        <span className="text-xs text-slate-400 block">Channel</span>
                        <span className="capitalize text-xs font-semibold text-slate-600">{fuData.notification_channel}</span>
                      </div>
                    )}
                    {(fuData.notes || fuData.custom_message) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(itemKey)}
                        className="h-8 px-2 text-slate-500"
                      >
                        Details {isExpanded ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
                      </Button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="w-full mt-3 pt-3 border-t border-slate-100 text-xs space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      {fuData.custom_message && (
                        <div>
                          <strong className="text-slate-700 block">Reminder Message:</strong>
                          <p className="text-slate-600 italic mt-0.5 bg-slate-50 p-2 rounded border border-slate-100 font-serif">&ldquo;{fuData.custom_message}&rdquo;</p>
                        </div>
                      )}
                      {fuData.notes && (
                        <div>
                          <strong className="text-slate-700 block">Follow-up Notes:</strong>
                          <p className="text-slate-600 mt-0.5">{fuData.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
