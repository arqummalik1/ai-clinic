import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const [c, u, p, rx] = await Promise.all([
    supabase.from("clinics").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("patients").select("id", { count: "exact", head: true }),
    supabase.from("prescriptions").select("id", { count: "exact", head: true }),
  ]);

  const tiles = [
    { label: "Clinics", count: c.count ?? 0 },
    { label: "Users", count: u.count ?? 0 },
    { label: "Patients", count: p.count ?? 0 },
    { label: "Prescriptions", count: rx.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Global analytics</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <CardHeader><CardTitle className="text-sm text-muted-foreground">{t.label}</CardTitle></CardHeader>
            <CardContent className="text-3xl font-bold">{t.count}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
