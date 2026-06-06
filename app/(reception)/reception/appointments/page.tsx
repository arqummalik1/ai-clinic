import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppointmentQueue } from "@/components/appointments/AppointmentQueue";
import { AppointmentDateFilter } from "./AppointmentDateFilter";
import { Plus, CalendarClock } from "lucide-react";
import { todayISO, formatCurrencyINR } from "@/lib/utils";

const STATUS_VARIANT: Record<string, "warning" | "info" | "success" | "destructive" | "secondary"> = {
  waiting: "warning",
  in_progress: "info",
  completed: "success",
  cancelled: "destructive",
  no_show: "secondary",
};

type AppointmentRow = {
  id: string;
  token_number: number | null;
  status: string;
  patient_id: string;
  doctor_id: string;
  consultation_fee: number | null;
  fee_paid: boolean | null;
};

async function HistoricalTable({ date }: { date: string }) {
  const supabase = await createClient();

  // RLS scopes appointments to the caller's clinic. Fetch scalars first, then
  // resolve patient + doctor names separately (matches the codebase pattern of
  // avoiding RLS-sensitive joins on appointments).
  const { data: apts } = await supabase
    .from("appointments")
    .select("id, token_number, status, patient_id, doctor_id, consultation_fee, fee_paid")
    .eq("appointment_date", date)
    .order("token_number");

  const rows = (apts as AppointmentRow[]) ?? [];

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarClock className="mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No appointments on {date}.</p>
        </CardContent>
      </Card>
    );
  }

  const patientIds = [...new Set(rows.map((r) => r.patient_id))];
  const doctorIds = [...new Set(rows.map((r) => r.doctor_id))];

  const [{ data: patients }, { data: doctors }] = await Promise.all([
    supabase.from("patients").select("id, full_name, phone").in("id", patientIds),
    supabase.from("users").select("id, full_name").in("id", doctorIds),
  ]);

  const patientMap = new Map((patients ?? []).map((p) => [p.id, p]));
  const doctorMap = new Map((doctors ?? []).map((d) => [d.id, d.full_name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments on {date}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Doctor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead className="text-right">Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const patient = patientMap.get(r.patient_id);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">#{r.token_number ?? "—"}</TableCell>
                  <TableCell>
                    <div className="font-medium">{patient?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{patient?.phone ?? ""}</div>
                  </TableCell>
                  <TableCell className="text-sm">Dr. {doctorMap.get(r.doctor_id) ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>
                      {r.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.consultation_fee ? formatCurrencyINR(Number(r.consultation_fee)) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {r.fee_paid ? (
                      <Badge variant="success">Paid</Badge>
                    ) : (
                      <Badge variant="warning">Due</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = todayISO();
  const selectedDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
  const isToday = selectedDate === today;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isToday ? "Today's appointments" : "Appointment history"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isToday ? "Live queue across all doctors" : `Read-only view for ${selectedDate}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AppointmentDateFilter selectedDate={selectedDate} />
          <Link href="/reception/appointments/new">
            <Button><Plus className="mr-2 h-4 w-4" /> New</Button>
          </Link>
        </div>
      </div>

      {isToday ? (
        <Card>
          <CardHeader><CardTitle>Queue</CardTitle></CardHeader>
          <CardContent><AppointmentQueue actionsScope="reception" /></CardContent>
        </Card>
      ) : (
        <HistoricalTable date={selectedDate} />
      )}
    </div>
  );
}
