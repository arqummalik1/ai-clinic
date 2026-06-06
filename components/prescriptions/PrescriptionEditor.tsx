"use client";

import { Trash2, Plus, Pill, FlaskConical, MessageSquare, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StructuredPrescription, Medicine } from "@/lib/ai";

interface Props {
  value: StructuredPrescription;
  onChange: (next: StructuredPrescription) => void;
}

export function PrescriptionEditor({ value, onChange }: Props) {
  const updateMed = (i: number, field: keyof Medicine, v: string) => {
    const next = [...value.medicines];
    next[i] = { ...next[i], [field]: v };
    onChange({ ...value, medicines: next });
  };

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
            <Label>Diagnosis</Label>
            <Input value={value.diagnosis} onChange={(e) => onChange({ ...value, diagnosis: e.target.value })} />
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
          {value.medicines.length === 0 && (
            <p className="text-sm text-muted-foreground">No medicines yet. Click Add to insert one.</p>
          )}
          {value.medicines.map((m, i) => (
            <div key={i} className="grid gap-2 rounded-lg border p-3 md:grid-cols-6">
              <Input className="md:col-span-2" placeholder="Name" value={m.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
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
          ))}
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
            <Input
              type="number"
              min={0}
              value={value.followUpDays ?? ""}
              onChange={(e) => onChange({ ...value, followUpDays: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
