"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const PERMISSIONS = [
  { key: "can_view_earnings", label: "View earnings dashboard" },
  { key: "can_view_all_patients", label: "View all patients (not just assigned)" },
  { key: "can_export_prescriptions", label: "Export prescriptions as PDF" },
  { key: "can_view_other_doctors", label: "View other doctors' schedules" },
  { key: "can_manage_follow_ups", label: "Manage follow-ups" },
] as const;

type Permissions = Record<(typeof PERMISSIONS)[number]["key"], boolean>;

const DEFAULTS: Permissions = {
  can_view_earnings: true,
  can_view_all_patients: false,
  can_export_prescriptions: true,
  can_view_other_doctors: false,
  can_manage_follow_ups: true,
};

export function PermissionsCheckboxPanel({ userId, clinicId }: { userId: string; clinicId: string }) {
  const [permissions, setPermissions] = useState<Permissions>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: dbError } = await supabase
        .from("user_permissions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (dbError) {
        throw new Error(`Supabase loading failed: ${dbError.message}`);
      }

      if (data) {
        setPermissions({
          can_view_earnings: !!data.can_view_earnings,
          can_view_all_patients: !!data.can_view_all_patients,
          can_export_prescriptions: !!data.can_export_prescriptions,
          can_view_other_doctors: !!data.can_view_other_doctors,
          can_manage_follow_ups: !!data.can_manage_follow_ups,
        });
      }
    } catch (err) {
      console.error("[PermissionsCheckboxPanel] Exception caught during load:", err);
      setError(err instanceof Error ? err.message : "Failed to load permissions due to an unexpected connection error.");
      toast.error("Failed to load doctor permissions.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("user_permissions")
      .upsert({ user_id: userId, clinic_id: clinicId, ...permissions }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Permissions updated");
  };

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="space-y-4 p-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-8 w-8 text-destructive animate-bounce" />
          <h3 className="text-sm font-semibold text-destructive">Failed to load doctor permissions</h3>
          <p className="text-xs text-muted-foreground max-w-sm">{error}</p>
          <Button size="sm" variant="outline" onClick={load}>
            Retry Load
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) return <div className="h-48 animate-pulse rounded-xl bg-secondary" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor permissions</CardTitle>
        <CardDescription>Control what this doctor can see and do</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {PERMISSIONS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between rounded-lg border p-3">
            <Label className="text-sm">{label}</Label>
            <Switch
              checked={permissions[key]}
              onCheckedChange={(v) => setPermissions((p) => ({ ...p, [key]: v }))}
            />
          </div>
        ))}
        <Button onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Saving…" : "Save permissions"}
        </Button>
      </CardContent>
    </Card>
  );
}
