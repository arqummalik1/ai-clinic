"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createStaff, type CreateStaffState } from "../actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";

const initial: CreateStaffState = {};

export default function NewStaffPage() {
  const [state, action, pending] = useActionState(createStaff, initial);
  const [role, setRole] = useState<"doctor" | "receptionist">("doctor");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/clinic-admin/users" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to staff
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Add staff member</CardTitle>
          <CardDescription>Create login credentials for a doctor or receptionist</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="fullName">Full name</Label>
                <Input id="fullName" name="fullName" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <Select id="role" name="role" value={role} onChange={(e) => setRole(e.target.value as "doctor" | "receptionist")} required>
                  <option value="doctor">Doctor</option>
                  <option value="receptionist">Receptionist</option>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Temporary password</Label>
              <Input id="password" name="password" type="password" minLength={8} required />
              <p className="text-xs text-muted-foreground">Min 8 chars. Share it with the user; they can change it later.</p>
            </div>

            {role === "doctor" && (
              <div className="rounded-lg border bg-secondary/30 p-4 space-y-4">
                <p className="text-sm font-medium">Doctor profile</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input id="specialization" name="specialization" placeholder="e.g. Cardiology" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" name="qualification" placeholder="MBBS, MD" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="registrationNo">Registration No</Label>
                    <Input id="registrationNo" name="registrationNo" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="consultationFee">Consultation fee (₹)</Label>
                    <Input id="consultationFee" name="consultationFee" type="number" min={0} step={50} defaultValue={500} />
                  </div>
                </div>
              </div>
            )}

            {state.error && <p className="text-sm text-destructive">{state.error}</p>}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating…" : "Create staff member"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
