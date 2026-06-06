import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus } from "lucide-react";

export default async function ClinicsPage() {
  const supabase = await createClient();
  const { data: clinics } = await supabase
    .from("clinics")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinics</h1>
          <p className="text-sm text-muted-foreground">All clinics in the MediSync network</p>
        </div>
        <Link href="/super-admin/clinics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New clinic
          </Button>
        </Link>
      </div>

      {(!clinics || clinics.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No clinics yet</p>
            <p className="text-sm text-muted-foreground">Create the first clinic and its admin to get started.</p>
            <Link href="/super-admin/clinics/new" className="mt-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create clinic
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {clinics?.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{c.name}</span>
                <Badge variant={c.is_active ? "success" : "secondary"}>
                  {c.is_active ? "Active" : "Disabled"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{c.address ?? "No address on file"}</p>
              <p className="text-sm text-muted-foreground">{c.phone ?? "—"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
