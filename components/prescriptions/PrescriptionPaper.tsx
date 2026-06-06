"use client";

import { useState } from "react";
import { Trash2, Plus, CheckCircle2, AlertTriangle, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { StructuredPrescription, Medicine } from "@/lib/ai";
import { assessMedicine, transcriptSupports, transcriptEvidence } from "@/lib/trust";

type FavoriteMedicine = Medicine & { count?: number };

export interface PaperHeader {
  doctorName: string;
  qualification?: string | null;
  degree?: string | null;
  registrationNo?: string | null;
  clinicName: string;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
}

interface Props {
  value: StructuredPrescription;
  onChange: (next: StructuredPrescription) => void;
  favorites?: FavoriteMedicine[];
  transcript?: string;
  aiGenerated?: boolean;
  editedFields?: string[];
  header?: PaperHeader | null;
  patient: { name: string; age?: number | null; gender?: string | null; allergies?: string[] | null };
  date: string;
}

// Borderless, document-style input that reveals an underline on hover/focus.
const inkInput =
  "w-full bg-transparent px-1 py-0.5 text-slate-900 outline-none border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-400 transition-colors";

const VITAL_FIELDS: { key: keyof NonNullable<StructuredPrescription["vitals"]>; label: string; step?: string }[] = [
  { key: "bpSystolic", label: "Systolic BP" },
  { key: "bpDiastolic", label: "Diastolic BP" },
  { key: "pulseRate", label: "Pulse (bpm)" },
  { key: "temperatureF", label: "Temp (°F)", step: "0.1" },
  { key: "spo2", label: "SpO₂ (%)" },
  { key: "weightKg", label: "Weight (kg)", step: "0.1" },
  { key: "heightCm", label: "Height (cm)", step: "0.1" },
  { key: "bmi", label: "BMI", step: "0.1" },
];

export function PrescriptionPaper({ value, onChange, favorites, transcript, aiGenerated, editedFields, header, patient, date }: Props) {
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);
  const edited = new Set(editedFields ?? []);
  const showMedTrust = !!aiGenerated && !!transcript && !edited.has("medicines");
  const showDxTrust = !!aiGenerated && !!transcript && !edited.has("diagnosis") && !!value.diagnosis.trim();
  const dxHeard = showDxTrust && transcriptSupports(transcript, value.diagnosis);

  const updateMed = (i: number, field: keyof Medicine, v: string) => {
    const next = [...value.medicines];
    next[i] = { ...next[i], [field]: v };
    if (field === "name" && favorites?.length) {
      const fav = favorites.find((f) => f.name.toLowerCase() === v.trim().toLowerCase());
      const row = next[i];
      if (fav && !row.dosage && !row.frequency && !row.duration && !row.instructions) {
        next[i] = { ...row, dosage: fav.dosage, frequency: fav.frequency, duration: fav.duration, instructions: fav.instructions };
      }
    }
    onChange({ ...value, medicines: next });
  };
  const addMed = () => onChange({ ...value, medicines: [...value.medicines, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }] });
  const removeMed = (i: number) => onChange({ ...value, medicines: value.medicines.filter((_, idx) => idx !== i) });
  const addFavorite = (fav: FavoriteMedicine) =>
    onChange({ ...value, medicines: [...value.medicines, { name: fav.name, dosage: fav.dosage, frequency: fav.frequency, duration: fav.duration, instructions: fav.instructions }] });

  const updateLab = (i: number, v: string) => {
    const next = [...value.labTests];
    next[i] = v;
    onChange({ ...value, labTests: next });
  };

  const updateVital = (key: keyof NonNullable<StructuredPrescription["vitals"]>, raw: string) => {
    const val = raw ? Number(raw) : null;
    const nextVitals = { ...value.vitals, [key]: val };
    if (key === "weightKg" || key === "heightCm") {
      const w = key === "weightKg" ? val : value.vitals?.weightKg ?? null;
      const h = key === "heightCm" ? val : value.vitals?.heightCm ?? null;
      if (w && h && h > 0) nextVitals.bmi = Number((w / ((h / 100) ** 2)).toFixed(1));
    }
    onChange({ ...value, vitals: nextVitals });
  };

  const allergies = (patient.allergies ?? []).filter(Boolean);
  const v = value.vitals;
  const vitalsSummary = [
    v?.bpSystolic && v?.bpDiastolic ? `BP ${v.bpSystolic}/${v.bpDiastolic}` : null,
    v?.pulseRate ? `Pulse ${v.pulseRate}` : null,
    v?.temperatureF ? `Temp ${v.temperatureF}°F` : null,
    v?.spo2 ? `SpO₂ ${v.spo2}%` : null,
    v?.weightKg ? `Wt ${v.weightKg}kg` : null,
  ].filter(Boolean);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header band */}
      <div className="flex items-start justify-between gap-4 bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-5 text-white">
        <div>
          <p className="text-lg font-bold leading-tight">Dr. {header?.doctorName ?? "—"}</p>
          {(header?.qualification || header?.degree) && (
            <p className="text-xs text-indigo-100">{[header?.qualification, header?.degree].filter(Boolean).join(" | ")}</p>
          )}
          {header?.registrationNo && <p className="text-xs text-indigo-100">Reg: {header.registrationNo}</p>}
        </div>
        <div className="text-right">
          <p className="font-semibold leading-tight">{header?.clinicName ?? "Clinic"}</p>
          {header?.clinicAddress && <p className="text-xs text-indigo-100">{header.clinicAddress}</p>}
          {header?.clinicPhone && <p className="text-xs text-indigo-100">Ph: {header.clinicPhone}</p>}
        </div>
      </div>

      {/* Patient strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3 text-sm">
        <span className="font-medium text-slate-800">{patient.name}</span>
        <span className="text-slate-500">Age: {patient.age ?? "—"} · {patient.gender ?? "—"}</span>
        <span className="text-slate-500">Date: {date}</span>
      </div>

      <div className="space-y-5 px-6 py-5">
        {/* Allergy strip */}
        {allergies.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            ⚠ Allergies: {allergies.join(", ")}
          </div>
        )}

        {/* Vitals summary line */}
        {vitalsSummary.length > 0 && (
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-600">Vitals:</span> {vitalsSummary.join("   ·   ")}
          </p>
        )}

        {/* Complaint + Diagnosis */}
        <div className="space-y-2 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="w-24 flex-none font-semibold text-slate-500">Complaint</span>
            <input className={inkInput} value={value.chiefComplaint} placeholder="—" onChange={(e) => onChange({ ...value, chiefComplaint: e.target.value })} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="w-24 flex-none font-semibold text-slate-500">Diagnosis</span>
            <input className={cn(inkInput, "font-medium")} value={value.diagnosis} placeholder="—" onChange={(e) => onChange({ ...value, diagnosis: e.target.value })} />
            {showDxTrust && (
              dxHeard ? (
                <span className="inline-flex flex-none items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3 w-3" /> Heard
                </span>
              ) : (
                <button type="button" onClick={() => setOpenEvidence(openEvidence === "dx" ? null : "dx")} className="inline-flex flex-none items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  <AlertTriangle className="h-3 w-3" /> Verify
                </button>
              )
            )}
          </div>
          {openEvidence === "dx" && (
            <p className="ml-24 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-700">Not clearly detected in your dictation — please confirm.</p>
          )}
        </div>

        {/* Rx + medicines */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-serif text-2xl font-bold text-indigo-700" aria-hidden>℞</span>
            <div className="flex items-center gap-2">
              {favorites && favorites.length > 0 && (
                <div className="hidden flex-wrap gap-1 sm:flex">
                  {favorites.slice(0, 4).map((f) => (
                    <button key={f.name} type="button" onClick={() => addFavorite(f)} className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 hover:bg-indigo-100">
                      + {f.name}
                    </button>
                  ))}
                </div>
              )}
              <Button size="sm" variant="outline" onClick={addMed} className="h-7 rounded-full text-xs">
                <Plus className="mr-1 h-3 w-3" /> Add
              </Button>
            </div>
          </div>

          <datalist id="paper-med-favorites">
            {(favorites ?? []).map((f) => <option key={f.name} value={f.name} />)}
          </datalist>

          {value.medicines.length === 0 && <p className="text-sm text-slate-400">No medicines yet — say or add one.</p>}

          <ol className="space-y-3">
            {value.medicines.map((m, i) => {
              const trust = showMedTrust && m.name.trim() ? assessMedicine(transcript, m.name, m.dosage) : null;
              const evKey = `med-${i}`;
              const evidence = trust && !trust.nameHeard ? transcriptEvidence(transcript, m.name) : null;
              return (
                <li key={i} className="border-b border-dashed border-slate-100 pb-3 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 text-sm font-semibold text-slate-400">{i + 1}.</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <input list="paper-med-favorites" className={cn(inkInput, "font-semibold")} placeholder="Medicine name" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
                        {trust && (
                          trust.level === "heard" ? (
                            <span className="inline-flex flex-none items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" /> Heard
                            </span>
                          ) : (
                            <button type="button" onClick={() => setOpenEvidence(openEvidence === evKey ? null : evKey)} className="inline-flex flex-none items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700" title="Tap to see what you said">
                              <AlertTriangle className="h-3 w-3" /> {trust.nameHeard ? "Verify dose" : "Verify"}
                            </button>
                          )
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 flex-none" onClick={() => removeMed(i)}>
                          <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                        </Button>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-x-3 sm:grid-cols-4">
                        <input className={cn(inkInput, "text-xs text-slate-600")} placeholder="Dosage" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                        <input className={cn(inkInput, "text-xs text-slate-600")} placeholder="Frequency" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
                        <input className={cn(inkInput, "text-xs text-slate-600")} placeholder="Duration" value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
                        <input className={cn(inkInput, "text-xs text-slate-600")} placeholder="Instructions" value={m.instructions} onChange={(e) => updateMed(i, "instructions", e.target.value)} />
                      </div>
                      {openEvidence === evKey && (
                        <div className="mt-1.5 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-800">
                          <Quote className="mt-0.5 h-3 w-3 flex-none" />
                          {evidence ? <span>You said: <span className="font-mono">{evidence}</span></span> : <span>Not detected in your dictation — please confirm.</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Investigations */}
        <div className="text-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-slate-500">Investigations</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onChange({ ...value, labTests: [...value.labTests, ""] })}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </div>
          {value.labTests.length === 0 ? (
            <p className="text-xs text-slate-400">None</p>
          ) : (
            <ul className="space-y-1">
              {value.labTests.map((t, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-slate-400">•</span>
                  <input className={inkInput} value={t} placeholder="Test name" onChange={(e) => updateLab(i, e.target.value)} />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onChange({ ...value, labTests: value.labTests.filter((_, idx) => idx !== i) })}>
                    <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Advice */}
        <div className="text-sm">
          <span className="font-semibold text-slate-500">Advice</span>
          <textarea
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-slate-800 outline-none focus:border-indigo-400"
            value={value.advice}
            placeholder="—"
            onChange={(e) => onChange({ ...value, advice: e.target.value })}
          />
        </div>

        {/* Follow-up */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-500">Follow-up</span>
          <div className="flex flex-wrap gap-1.5">
            {[3, 5, 7, 15, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...value, followUpDays: value.followUpDays === d ? null : d })}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition",
                  value.followUpDays === d ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Vitals editor (collapsible) */}
        <details className="group rounded-lg border border-slate-200 text-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 font-medium text-slate-600 [&::-webkit-details-marker]:hidden">
            Edit vitals
            <Plus className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-45" />
          </summary>
          <div className="grid grid-cols-2 gap-3 px-3 pb-3 sm:grid-cols-4">
            {VITAL_FIELDS.map((f) => (
              <label key={f.key} className="text-xs text-slate-500">
                {f.label}
                <input
                  type="number"
                  step={f.step}
                  className="mt-0.5 w-full rounded-md border border-slate-200 bg-transparent px-2 py-1 text-sm text-slate-800 outline-none focus:border-indigo-400"
                  value={value.vitals?.[f.key] ?? ""}
                  onChange={(e) => updateVital(f.key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </details>

        {/* Internal clinical summary */}
        <div className="text-sm">
          <span className="flex items-center gap-1.5 font-semibold text-slate-500">
            Internal note
            <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-normal text-amber-600">Not printed</span>
          </span>
          <textarea
            rows={2}
            className="mt-1 w-full resize-none rounded-md border border-slate-200 bg-transparent px-2 py-1.5 text-slate-700 outline-none focus:border-indigo-400"
            value={value.clinicalSummary || ""}
            placeholder="Private summary for your reference…"
            onChange={(e) => onChange({ ...value, clinicalSummary: e.target.value })}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between gap-4 border-t border-slate-200 px-6 py-4">
        <p className="text-[11px] leading-relaxed text-slate-400">
          {header?.clinicName}
          {header?.clinicAddress ? ` · ${header.clinicAddress}` : ""}
          {header?.clinicPhone ? ` · ${header.clinicPhone}` : ""}
        </p>
        <div className="text-center">
          <div className="h-8 w-40 border-b border-slate-300" />
          <p className="mt-1 text-xs text-slate-500">Dr. {header?.doctorName ?? ""}</p>
        </div>
      </div>
    </div>
  );
}
