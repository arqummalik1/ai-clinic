"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { forgotAction, type ForgotState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const initial: ForgotState = {};

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotAction, initial);

  return (
    <Card className="border-0 shadow-xl shadow-slate-200/60">
      <CardHeader className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Mail className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a link to set a new password</CardDescription>
      </CardHeader>
      <CardContent>
        {state.success ? (
          <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Check your inbox for the reset link.
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
