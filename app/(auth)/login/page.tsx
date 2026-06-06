"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Stethoscope } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initial: LoginState = {};

function SignupSuccessBanner() {
  const params = useSearchParams();
  const justSignedUp = params.get("signup") === "success";
  if (!justSignedUp) return null;
  return (
    <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
      Account created successfully! Please sign in.
    </div>
  );
}

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <Card className="border-0 shadow-xl shadow-slate-200/60">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Stethoscope className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to your MediSync account</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <SignupSuccessBanner />
        </Suspense>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="doctor@clinic.com" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {state.error && (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing in…" : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Create your clinic
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
