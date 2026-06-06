"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createAppointmentAction } from "@/app/actions/appointments";
import { createPatientAction } from "@/app/actions/patients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/utils";
import { AlertTriangle, Loader2, Plus, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface DoctorOpt { id: string; full_name: string; consultation_fee: number }
interface PatientOpt { id: string; full_name: string; phone: string | null }

export function NewAppointmentForm() {
  const router = useRouter();
  const params = useSearchParams();
  const preselectPatient = params.get("patientId");

  const [doctors, setDoctors] = useState<DoctorOpt[]>([]);
  const [doctorsLoaded, setDoctorsLoaded] = useState(false);
  const [patients, setPatients] = useState<PatientOpt[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [patientId, setPatientId] = useState(preselectPatient ?? "");
  const [date, setDate] = useState(todayISO());
  const [fee, setFee] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "pending">("paid");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "card" | "insurance">("cash");
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New patient creation state
  const [showNewPatientDialog, setShowNewPatientDialog] = useState(false);
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [newPatient, setNewPatient] = useState({
    full_name: "",
    phone: "",
    email: "",
    age: "",
    gender: "" as "" | "Male" | "Female" | "Other",
    address: "",
  });

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("users")
      .select("id, full_name, doctor_profiles(consultation_fee)")
      .eq("role", "doctor")
      .eq("is_active", true)
      .then(({ data }) => {
        const list = (data ?? []).map((d) => {
          const dp = (d as { doctor_profiles?: { consultation_fee?: number } | { consultation_fee?: number }[] }).doctor_profiles;
          const profile = Array.isArray(dp) ? dp[0] : dp;
          return { id: d.id, full_name: d.full_name, consultation_fee: profile?.consultation_fee ?? 0 };
        });
        setDoctors(list);
        if (list[0]) {
          setDoctorId(list[0].id);
          setFee(list[0].consultation_fee);
        }
        setDoctorsLoaded(true);
      });
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const t = setTimeout(() => {
      let q = supabase.from("patients").select("id, full_name, phone").order("created_at", { ascending: false }).limit(20);
      if (search) q = q.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
      q.then(({ data }) => setPatients((data as PatientOpt[]) ?? []));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  const onDoctorChange = (id: string) => {
    setDoctorId(id);
    const d = doctors.find((x) => x.id === id);
    if (d) setFee(d.consultation_fee);
  };

  const handleCreatePatient = async () => {
    if (!newPatient.full_name.trim()) {
      toast.error("Patient name is required");
      return;
    }
    if (!newPatient.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setCreatingPatient(true);
    const result = await createPatientAction({
      full_name: newPatient.full_name.trim(),
      phone: newPatient.phone.trim(),
      email: newPatient.email.trim() || null,
      age: newPatient.age ? parseInt(newPatient.age) : null,
      gender: newPatient.gender || null,
      address: newPatient.address.trim() || null,
    });
    setCreatingPatient(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to create patient");
      return;
    }

    toast.success("Patient created successfully");
    setPatientId(result.patientId!);
    setShowNewPatientDialog(false);
    
    // Reset form
    setNewPatient({
      full_name: "",
      phone: "",
      email: "",
      age: "",
      gender: "",
      address: "",
    });

    // Refresh patient list
    const supabase = createClient();
    const { data } = await supabase
      .from("patients")
      .select("id, full_name, phone")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setPatients(data as PatientOpt[]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !patientId) {
      toast.error("Pick a doctor and patient");
      return;
    }
    setSubmitting(true);
    const result = await createAppointmentAction({
      doctor_id: doctorId,
      patient_id: patientId,
      appointment_date: date,
      consultation_fee: fee,
      fee_paid: paymentStatus === "paid",
      payment_method: paymentMethod,
      status: "waiting",
    });
    setSubmitting(false);
    if (!result.success) {
      toast.error(result.error ?? "Failed to create appointment");
      return;
    }
    toast.success(`Appointment created · token #${result.tokenNumber}`);
    router.push("/reception/appointments");
  };

  if (doctorsLoaded && doctors.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
          <p className="font-medium">No doctors found in your clinic</p>
          <p className="text-sm text-muted-foreground">
            Ask your clinic admin to add at least one doctor before booking an appointment.
          </p>
          <Link href="/reception/dashboard">
            <Button variant="outline" size="sm">Back to dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const canSubmit = !!doctorId && !!patientId && !submitting;

  return (
    <>
      <form onSubmit={submit} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Patient</CardTitle>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setShowNewPatientDialog(true)}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                New patient
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Search by name or phone…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)} required>
              <option value="">Select patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} {p.phone ? `· ${p.phone}` : ""}</option>
              ))}
            </Select>
            {!patientId && patients.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No patients found. Click "New patient" to add one.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Visit</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={doctorId} onChange={(e) => onDoctorChange(e.target.value)} required>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Fee (₹)</Label>
              <Input type="number" min={0} step={50} value={fee} onChange={(e) => setFee(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Payment status</Label>
              <Select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as "paid" | "pending")}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Payment method</Label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "cash" | "upi" | "card" | "insurance")}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="insurance">Insurance</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={!canSubmit} className="w-full gap-2">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating…
            </>
          ) : !patientId ? (
            "Pick a patient first"
          ) : (
            "Create appointment"
          )}
        </Button>
      </form>

      {/* New Patient Dialog */}
      <Dialog open={showNewPatientDialog} onOpenChange={setShowNewPatientDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add new patient</DialogTitle>
            <DialogDescription>
              Create a patient record and book appointment in one flow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full name *</Label>
              <Input
                value={newPatient.full_name}
                onChange={(e) => setNewPatient({ ...newPatient, full_name: e.target.value })}
                placeholder="Enter patient name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={newPatient.phone}
                onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                placeholder="Enter phone number"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  value={newPatient.age}
                  onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                  placeholder="Age"
                  min={0}
                  max={150}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={newPatient.gender}
                  onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as "" | "Male" | "Female" | "Other" })}
                >
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                placeholder="patient@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={newPatient.address}
                onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewPatientDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreatePatient}
                disabled={creatingPatient}
                className="flex-1 gap-2"
              >
                {creatingPatient ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create patient
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
