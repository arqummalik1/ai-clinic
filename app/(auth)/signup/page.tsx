"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { signupAction, type SignupState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initial: SignupState = {};

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signupAction, initial);

  return (
    <Card className="border-0 shadow-xl shadow-slate-200/60">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Stethoscope className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Create your clinic</CardTitle>
        <CardDescription>Set up your MediSync account in 30 seconds</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Your full name</Label>
            <Input id="fullName" name="fullName" placeholder="Dr. Priya Sharma" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="clinicName">Clinic name</Label>
            <Input id="clinicName" name="clinicName" placeholder="Sunrise Medical Center" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="doctor@clinic.com" autoComplete="email" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Min 8 characters" autoComplete="new-password" required minLength={8} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repeat password" autoComplete="new-password" required />
            </div>
          </div>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating your clinic…" : "Create clinic & start free"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
