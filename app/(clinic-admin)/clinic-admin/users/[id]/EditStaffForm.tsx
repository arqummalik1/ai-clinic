"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateStaff, type UpdateStaffState } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface DoctorProfile {
  specialization?: string | null;
  qualification?: string | null;
  registration_no?: string | null;
  consultation_fee?: number | null;
}

interface StaffUser {
  id: string;
  full_name: string;
  phone: string | null;
  role: string;
}

const initial: UpdateStaffState = {};

export function EditStaffForm({
  user,
  doctorProfile,
}: {
  user: StaffUser;
  doctorProfile?: DoctorProfile;
}) {
  const router = useRouter();
  // Bind the userId so the action matches the (prevState, formData) signature.
  const action = updateStaff.bind(null, user.id);
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state.success) {
      toast.success("Staff details updated");
      router.refresh();
    }
  }, [state.success, router]);

  const isDoctor = user.role === "doctor";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Edit details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" defaultValue={user.full_name} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={user.phone ?? ""} />
            </div>
          </div>

          {isDoctor && (
            <div className="grid gap-4 rounded-lg border bg-secondary/30 p-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="specialization">Specialization</Label>
                <Input id="specialization" name="specialization" defaultValue={doctorProfile?.specialization ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="qualification">Qualification</Label>
                <Input id="qualification" name="qualification" defaultValue={doctorProfile?.qualification ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="registrationNo">Registration No</Label>
                <Input id="registrationNo" name="registrationNo" defaultValue={doctorProfile?.registration_no ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="consultationFee">Consultation fee (₹)</Label>
                <Input
                  id="consultationFee"
                  name="consultationFee"
                  type="number"
                  min={0}
                  step={50}
                  defaultValue={doctorProfile?.consultation_fee ?? 0}
                />
              </div>
            </div>
          )}

          {state.error && <p className="text-sm text-destructive" role="alert">{state.error}</p>}

          <Button type="submit" disabled={pending} className="gap-2">
            <Save className="h-4 w-4" />
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
