import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Mic, Plus } from "lucide-react";

export default async function DoctorPrescriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rows } = await supabase
    .from("prescriptions")
    .select("id, diagnosis, created_at, pdf_url, is_ai_generated, patients(full_name)")
    .eq("doctor_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prescriptions</h1>
          <p className="text-sm text-muted-foreground">Latest 100 prescriptions you&apos;ve issued</p>
        </div>
        <Link href="/doctor/voice-prescription">
          <Button className="bg-red-500 hover:bg-red-600">
            <Mic className="mr-2 h-4 w-4" /> New (voice)
          </Button>
        </Link>
      </div>

      {(!rows || rows.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No prescriptions yet</p>
            <Link href="/doctor/voice-prescription" className="mt-3">
              <Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Start with voice</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">PDF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const patientName = (r as { patients?: { full_name?: string } | { full_name?: string }[] }).patients;
                  const name = Array.isArray(patientName) ? patientName[0]?.full_name : patientName?.full_name;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{name ?? "—"}</TableCell>
                      <TableCell>{r.diagnosis}</TableCell>
                      <TableCell>
                        {r.is_ai_generated ? <Badge variant="info">Voice AI</Badge> : <Badge variant="secondary">Manual</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.pdf_url ? (
                          <a href={r.pdf_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Open</a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
