"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GenderType, GENDERS, PATHS } from "@/lib/constants";
import { createPatientAction } from "@/app/actions/patients";
import { Loader2, CheckCircle2, AlertCircle, UserPlus } from "lucide-react";

type SubmitState = "idle" | "submitting" | "success" | "error";

export function PatientForm({ redirectAfter = PATHS.RECEPTION_PATIENTS }: { redirectAfter?: string }) {
  const router = useRouter();
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    full_name: "",
    age: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    blood_group: "",
    allergies: "",
    notes: "",
  });

  const [vitals, setVitals] = useState({
    bp_systolic: "",
    bp_diastolic: "",
    weight_kg: "",
    temperature_f: "",
    pulse_rate: "",
    spo2: "",
    height_cm: "",
    bmi: "",
  });

  const handleVitalsChange = (field: keyof typeof vitals, val: string) => {
    const nextVitals = { ...vitals, [field]: val };
    
    if (field === "weight_kg" || field === "height_cm") {
      const weight = parseFloat(field === "weight_kg" ? val : vitals.weight_kg);
      const height = parseFloat(field === "height_cm" ? val : vitals.height_cm);
      
      if (!isNaN(weight) && !isNaN(height) && height > 0) {
        const heightMeters = height / 100;
        const calculatedBmi = (weight / (heightMeters * heightMeters)).toFixed(1);
        nextVitals.bmi = calculatedBmi;
      }
    }
    setVitals(nextVitals);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitState("submitting");
    setErrorMessage(null);

    const patientInput = {
      full_name: form.full_name,
      phone: form.phone,
      email: form.email || null,
      address: form.address || null,
      age: form.age ? parseInt(form.age) : null,
      gender: (form.gender || null) as GenderType | null,
      blood_group: form.blood_group || null,
      allergies: form.allergies ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean) : null,
      notes: form.notes || null,
      date_of_birth: null,
    };

    const vitalsInput = {
      bp_systolic: vitals.bp_systolic ? parseInt(vitals.bp_systolic) : null,
      bp_diastolic: vitals.bp_diastolic ? parseInt(vitals.bp_diastolic) : null,
      weight_kg: vitals.weight_kg ? parseFloat(vitals.weight_kg) : null,
      temperature_f: vitals.temperature_f ? parseFloat(vitals.temperature_f) : null,
      pulse_rate: vitals.pulse_rate ? parseInt(vitals.pulse_rate) : null,
      spo2: vitals.spo2 ? parseInt(vitals.spo2) : null,
      height_cm: vitals.height_cm ? parseFloat(vitals.height_cm) : null,
      bmi: vitals.bmi ? parseFloat(vitals.bmi) : null,
    };

    const result = await createPatientAction(patientInput, vitalsInput);

    if (!result.success) {
      setSubmitState("error");
      setErrorMessage(result.error ?? "Failed to register patient");
      toast.error(result.error ?? "Failed to register patient");
      setTimeout(() => setSubmitState("idle"), 3000);
      return;
    }

    setSubmitState("success");
    toast.success("Patient created successfully");
    setTimeout(() => router.push(redirectAfter), 800);
  };

  if (submitState === "submitting") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-16 shadow-sm">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Creating patient record…</h3>
          <p className="mt-1 text-sm text-muted-foreground">Saving patient details and vitals</p>
        </div>
        {/* Shimmer skeleton preview */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50">
            <div className="h-5 w-40 animate-pulse rounded bg-muted-foreground/20" />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 animate-pulse rounded bg-muted-foreground/20" />
                <div className="h-9 w-full animate-pulse rounded-md bg-muted-foreground/10" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitState === "success") {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border bg-white py-20 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-foreground">Patient created!</h3>
        <p className="mt-1 text-sm text-muted-foreground">Redirecting to patient list…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error banner */}
      {submitState === "error" && errorMessage && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive" />
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Patient details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
              placeholder="e.g. John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="e.g. +91 9876543210"
            />
          </div>
          <div className="space-y-2">
            <Label>Age</Label>
            <Input type="number" min={0} max={150} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g. 35" />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select…</option>
              <option value={GENDERS.MALE}>Male</option>
              <option value={GENDERS.FEMALE}>Female</option>
              <option value={GENDERS.OTHER}>Other</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="patient@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Blood group</Label>
            <Input placeholder="e.g. A+" value={form.blood_group} onChange={(e) => setForm({ ...form, blood_group: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Allergies (comma-separated)</Label>
            <Input placeholder="Penicillin, peanuts" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes…" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vitals (optional)</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>BP (sys / dia)</Label>
            <div className="flex items-center gap-2">
              <Input placeholder="120" value={vitals.bp_systolic} onChange={(e) => handleVitalsChange("bp_systolic", e.target.value)} />
              <span className="text-muted-foreground">/</span>
              <Input placeholder="80" value={vitals.bp_diastolic} onChange={(e) => handleVitalsChange("bp_diastolic", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weight (kg)</Label>
            <Input value={vitals.weight_kg} onChange={(e) => handleVitalsChange("weight_kg", e.target.value)} placeholder="e.g. 70" />
          </div>
          <div className="space-y-2">
            <Label>Temp (°F)</Label>
            <Input value={vitals.temperature_f} onChange={(e) => handleVitalsChange("temperature_f", e.target.value)} placeholder="e.g. 98.6" />
          </div>
          <div className="space-y-2">
            <Label>Pulse (bpm)</Label>
            <Input value={vitals.pulse_rate} onChange={(e) => handleVitalsChange("pulse_rate", e.target.value)} placeholder="e.g. 72" />
          </div>
          <div className="space-y-2">
            <Label>SpO₂ (%)</Label>
            <Input value={vitals.spo2} onChange={(e) => handleVitalsChange("spo2", e.target.value)} placeholder="e.g. 98" />
          </div>
          <div className="space-y-2">
            <Label>Height (cm)</Label>
            <Input value={vitals.height_cm} onChange={(e) => handleVitalsChange("height_cm", e.target.value)} placeholder="e.g. 175" />
          </div>
          <div className="space-y-2">
            <Label>BMI</Label>
            <Input value={vitals.bmi} onChange={(e) => handleVitalsChange("bmi", e.target.value)} placeholder="Auto-calculated" />
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        disabled={submitState !== "idle"}
        className="w-full gap-2"
        size="lg"
      >
        {submitState !== "idle" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving patient…
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Create patient
          </>
        )}
      </Button>
    </form>
  );
}