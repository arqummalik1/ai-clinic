"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClinicWithAdmin, type CreateClinicState } from "../actions";

const initial: CreateClinicState = {};

export default function NewClinicPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createClinicWithAdmin, initial);

  useEffect(() => {
    if (state.success) {
      toast.success("Clinic created");
      router.push("/super-admin/clinics");
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New clinic</CardTitle>
          <CardDescription>Creates the clinic and its first admin user in one step.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clinicName">Clinic name</Label>
              <Input id="clinicName" name="clinicName" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminName">Admin name</Label>
                <Input id="adminName" name="adminName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin email</Label>
                <Input id="adminEmail" name="adminEmail" type="email" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Admin password</Label>
              <Input id="adminPassword" name="adminPassword" type="password" minLength={8} required />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Creating…" : "Create clinic"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
