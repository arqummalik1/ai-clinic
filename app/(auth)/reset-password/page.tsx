"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound, CheckCircle2 } from "lucide-react";
import { resetPasswordAction, type ResetState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initial: ResetState = {};

export default function ResetPasswordPage() {
  const [state, formAction, pending] = useActionState(resetPasswordAction, initial);

  return (
    <Card className="border-0 shadow-xl shadow-slate-200/60">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password for your account</CardDescription>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. You can now sign in with your new password.
            </p>
            <Link href="/login">
              <Button className="w-full">Go to sign in</Button>
            </Link>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat password"
                autoComplete="new-password"
                required
              />
            </div>
            {state.error && (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Updating…" : "Update password"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                ← Back to sign in
              </Link>
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
