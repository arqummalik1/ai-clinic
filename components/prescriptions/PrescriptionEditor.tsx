"use client";

import { useState } from "react";
import { Trash2, Plus, Pill, FlaskConical, MessageSquare, Heart, CheckCircle2, AlertTriangle, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StructuredPrescription, Medicine } from "@/lib/ai";
import { assessMedicine, transcriptSupports, transcriptEvidence } from "@/lib/trust";

type FavoriteMedicine = Medicine & { count?: number };

interface Props {
  value: StructuredPrescription;
  onChange: (next: StructuredPrescription) => void;
  /** Doctor's personal medicine shelf, derived from their own history. */
  favorites?: FavoriteMedicine[];
  /** Raw voice transcript — powers the deterministic trust tags. */
  transcript?: string;
  /** Whether this prescription was AI-structured (tags only make sense then). */
  aiGenerated?: boolean;
  /** Top-level fields the doctor has manually edited (suppresses tags — their value is trusted). */
  editedFields?: string[];
}

export function PrescriptionEditor({ value, onChange, favorites, transcript, aiGenerated, editedFields }: Props) {
  const [openEvidence, setOpenEvidence] = useState<string | null>(null);
  const edited = new Set(editedFields ?? []);
  const showMedTrust = !!aiGenerated && !!transcript && !edited.has("medicines");
  const showDxTrust = !!aiGenerated && !!transcript && !edited.has("diagnosis") && !!value.diagnosis.trim();
  const dxHeard = showDxTrust && transcriptSupports(transcript, value.diagnosis);
  const updateMed = (i: number, field: keyof Medicine, v: string) => {
    const next = [...value.medicines];
    next[i] = { ...next[i], [field]: v };
    // Auto-fill the full regimen when the typed/selected name matches a favorite
    // and the rest of the row is still empty (turns authoring into confirming).
    if (field === "name" && favorites?.length) {
      const fav = favorites.find((f) => f.name.toLowerCase() === v.trim().toLowerCase());
      const row = next[i];
      if (fav && !row.dosage && !row.frequency && !row.duration && !row.instructions) {
        next[i] = { ...row, dosage: fav.dosage, frequency: fav.frequency, duration: fav.duration, instructions: fav.instructions };
      }
    }
    onChange({ ...value, medicines: next });
  };

  const addFavorite = (fav: FavoriteMedicine) =>
    onChange({
      ...value,
      medicines: [
        ...value.medicines,
        { name: fav.name, dosage: fav.dosage, frequency: fav.frequency, duration: fav.duration, instructions: fav.instructions },
      ],
    });

  const addMed = () =>
    onChange({
      ...value,
      medicines: [...value.medicines, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
    });

  const removeMed = (i: number) =>
    onChange({ ...value, medicines: value.medicines.filter((_, idx) => idx !== i) });

  const updateLab = (i: number, v: string) => {
    const next = [...value.labTests];
    next[i] = v;
    onChange({ ...value, labTests: next });
  };

  const updateVitalsField = (field: keyof Required<StructuredPrescription>["vitals"], val: number | null) => {
    const nextVitals = { ...value.vitals, [field]: val };
    if (field === "weightKg" || field === "heightCm") {
      const w = field === "weightKg" ? val : (value.vitals?.weightKg ?? null);
      const h = field === "heightCm" ? val : (value.vitals?.heightCm ?? null);
      if (w !== null && h !== null && h > 0) {
        nextVitals.bmi = Number((w / ((h / 100) ** 2)).toFixed(1));
      }
    }
    onChange({ ...value, vitals: nextVitals });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Diagnosis & complaint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Chief complaint</Label>
            <Input value={value.chiefComplaint} onChange={(e) => onChange({ ...value, chiefComplaint: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span>Diagnosis</span>
              {showDxTrust && (
                dxHeard ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" /> Heard
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setOpenEvidence(openEvidence === "dx" ? null : "dx")}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 hover:bg-amber-100"
                  >
                    <AlertTriangle className="h-3 w-3" /> Verify
                  </button>
                )
              )}
            </Label>
            <Input value={value.diagnosis} onChange={(e) => onChange({ ...value, diagnosis: e.target.value })} />
            {openEvidence === "dx" && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                Not clearly detected in your dictation — please confirm this diagnosis.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <span>Internal clinical summary</span>
              <span className="text-[10px] font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Won&apos;t show on printable PDF</span>
            </Label>
            <Textarea
              rows={3}
              value={value.clinicalSummary || ""}
              onChange={(e) => onChange({ ...value, clinicalSummary: e.target.value })}
              placeholder="A brief summary of the symptoms, findings, and treatment plan for doctor reference..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><Pill className="h-4 w-4" /> Medicines</span>
            <Button size="sm" variant="outline" onClick={addMed}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {favorites && favorites.length > 0 && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-2.5">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700/80">
                Your frequent medicines
              </p>
              <div className="flex flex-wrap gap-1.5">
                {favorites.slice(0, 10).map((fav) => (
                  <Button
                    key={fav.name}
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-full border-indigo-200 bg-white px-3 text-xs text-indigo-700 hover:bg-indigo-100"
                    onClick={() => addFavorite(fav)}
                    title={[fav.dosage, fav.frequency, fav.duration].filter(Boolean).join(" · ") || "Add"}
                  >
                    <Plus className="mr-1 h-3 w-3" /> {fav.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <datalist id="med-favorites">
            {(favorites ?? []).map((f) => (
              <option key={f.name} value={f.name} />
            ))}
          </datalist>
          {value.medicines.length === 0 && (
            <p className="text-sm text-muted-foreground">No medicines yet. Click Add to insert one.</p>
          )}
          {value.medicines.map((m, i) => {
            const trust = showMedTrust && m.name.trim() ? assessMedicine(transcript, m.name, m.dosage) : null;
            const evKey = `med-${i}`;
            const evidence = trust && !trust.nameHeard ? transcriptEvidence(transcript, m.name) : null;
            return (
            <div key={i} className="rounded-lg border p-3">
              {trust && (
                <div className="mb-2 flex items-center gap-2">
                  {trust.level === "heard" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Heard
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setOpenEvidence(openEvidence === evKey ? null : evKey)}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 hover:bg-amber-100"
                      title="Tap to see what you said"
                    >
                      <AlertTriangle className="h-3 w-3" />
                      {!trust.nameHeard ? "Verify name" : "Verify dosage"}
                    </button>
                  )}
                </div>
              )}
              <div className="grid gap-2 md:grid-cols-6">
                <Input list="med-favorites" className="md:col-span-2" placeholder="Name" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
                <Input placeholder="Dosage" value={m.dosage} onChange={(e) => updateMed(i, "dosage", e.target.value)} />
                <Input placeholder="Frequency" value={m.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} />
                <Input placeholder="Duration" value={m.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} />
                <div className="flex gap-2">
                  <Input placeholder="Instructions" value={m.instructions} onChange={(e) => updateMed(i, "instructions", e.target.value)} />
                  <Button size="icon" variant="ghost" onClick={() => removeMed(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {openEvidence === evKey && (
                <div className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 border border-amber-100 px-2 py-1.5 text-[11px] text-amber-800">
                  <Quote className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  {evidence ? (
                    <span>You said: <span className="font-mono">{evidence}</span></span>
                  ) : (
                    <span>This medicine wasn&apos;t detected in your dictation — please confirm the name and dosage.</span>
                  )}
                </div>
              )}
            </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Lab tests</span>
            <Button size="sm" variant="outline" onClick={() => onChange({ ...value, labTests: [...value.labTests, ""] })}>
              <Plus className="mr-1 h-3 w-3" /> Add
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {value.labTests.length === 0 && <p className="text-sm text-muted-foreground">None.</p>}
          {value.labTests.map((t, i) => (
            <div key={i} className="flex gap-2">
              <Input value={t} onChange={(e) => updateLab(i, e.target.value)} />
              <Button size="icon" variant="ghost" onClick={() => onChange({ ...value, labTests: value.labTests.filter((_, idx) => idx !== i) })}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-rose-700">
            <Heart className="h-4 w-4 text-rose-500 animate-pulse" /> Patient vitals & measurements
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className="space-y-2">
            <Label>Temperature (°F)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 98.6"
              value={value.vitals?.temperatureF ?? ""}
              onChange={(e) => updateVitalsField("temperatureF", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Systolic BP (mmHg)</Label>
            <Input
              type="number"
              placeholder="e.g. 120"
              value={value.vitals?.bpSystolic ?? ""}
              onChange={(e) => updateVitalsField("bpSystolic", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Diastolic BP (mmHg)</Label>
            <Input
              type="number"
              placeholder="e.g. 80"
              value={value.vitals?.bpDiastolic ?? ""}
              onChange={(e) => updateVitalsField("bpDiastolic", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Pulse Rate (bpm)</Label>
            <Input
              type="number"
              placeholder="e.g. 72"
              value={value.vitals?.pulseRate ?? ""}
              onChange={(e) => updateVitalsField("pulseRate", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Oxygen (SpO2 %)</Label>
            <Input
              type="number"
              placeholder="e.g. 98"
              value={value.vitals?.spo2 ?? ""}
              onChange={(e) => updateVitalsField("spo2", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 70"
              value={value.vitals?.weightKg ?? ""}
              onChange={(e) => updateVitalsField("weightKg", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>Height (cm)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="e.g. 175"
              value={value.vitals?.heightCm ?? ""}
              onChange={(e) => updateVitalsField("heightCm", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
          <div className="space-y-2">
            <Label>BMI</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="Auto-calculated"
              value={value.vitals?.bmi ?? ""}
              onChange={(e) => updateVitalsField("bmi", e.target.value ? Number(e.target.value) : null)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Advice & follow-up</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Advice</Label>
            <Textarea rows={3} value={value.advice} onChange={(e) => onChange({ ...value, advice: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Follow-up in (days)</Label>
            <div className="flex flex-wrap gap-1.5">
              {[3, 5, 7, 15, 30].map((d) => (
                <Button
                  key={d}
                  type="button"
                  size="sm"
                  variant={value.followUpDays === d ? "default" : "outline"}
                  className="h-7 rounded-full px-3 text-xs"
                  onClick={() => onChange({ ...value, followUpDays: value.followUpDays === d ? null : d })}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min={0}
              placeholder="Custom days"
              value={value.followUpDays ?? ""}
              onChange={(e) => onChange({ ...value, followUpDays: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
