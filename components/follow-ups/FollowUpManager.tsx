"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { todayISO } from "@/lib/utils";

type Filter = "today" | "week" | "overdue" | "all";

type FollowUpRow = {
  id: string;
  patient_id: string;
  doctor_id: string;
  follow_up_date: string;
  scheduled_send_at: string | null;
  notified: boolean;
  notification_channel: string | null;
  custom_message: string | null;
  patients?: { full_name: string; email: string | null; phone: string | null };
  users?: { full_name: string };
};

interface Props {
  scope?: "doctor" | "clinic";
  doctorId?: string;
}

export function FollowUpManager({ scope = "clinic", doctorId }: Props = {}) {
  const [filter, setFilter] = useState<Filter>("week");
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      let q = supabase
        .from("follow_ups")
        .select("*, patients(full_name, email, phone), users!doctor_id(full_name)")
        .order("follow_up_date");

      if (scope === "doctor" && doctorId) q = q.eq("doctor_id", doctorId);

      const today = todayISO();
      if (filter === "today") q = q.eq("follow_up_date", today);
      else if (filter === "week") {
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        q = q.gte("follow_up_date", today).lte("follow_up_date", weekFromNow.toISOString().split("T")[0]);
      } else if (filter === "overdue") {
        q = q.lt("follow_up_date", today).eq("notified", false);
      }

      const { data, error } = await q;
      if (error) {
        console.error("[FollowUpManager] Supabase query error:", error);
      } else {
        setRows((data as FollowUpRow[]) ?? []);
      }
    } catch (err) {
      console.error("[FollowUpManager] Runtime error:", err);
    } finally {
      setLoading(false);
    }
  }, [scope, doctorId, filter]);

  useEffect(() => {
    // load() sets a loading flag before awaiting the query — a standard
    // data-fetching pattern. The synchronous setState here is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const sendNow = async (row: FollowUpRow) => {
    const channel = row.notification_channel ?? (row.patients?.email ? "email" : row.patients?.phone ? "whatsapp" : null);
    if (!channel) {
      toast.error("Patient has no contact method");
      return;
    }
    const to = channel === "email" ? row.patients?.email : row.patients?.phone;
    if (!to) {
      toast.error("Missing recipient address");
      return;
    }
    const body =
      row.custom_message ??
      `Reminder from MediSync: please book your follow-up appointment scheduled for ${row.follow_up_date}.`;

    const res = await fetch("/api/notifications/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, channel, subject: "Follow-up reminder", body, recipientId: row.patient_id }),
    });
    const j = await res.json();
    if (j.ok) {
      const supabase = createClient();
      await supabase
        .from("follow_ups")
        .update({ notified: true, reminder_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      toast.success("Reminder sent");
      load();
    } else {
      toast.error(j.error ?? "Send failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Follow-up reminders</span>
          <Select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="w-40">
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="overdue">Overdue</option>
            <option value="all">All upcoming</option>
          </Select>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!loading && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No follow-ups in this view.</p>
        )}
        {rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const overdue = !r.notified && r.follow_up_date < todayISO();
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.patients?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.patients?.email ?? r.patients?.phone ?? ""}</div>
                    </TableCell>
                    <TableCell className="text-sm">Dr. {r.users?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        {overdue ? <AlertCircle className="h-3 w-3 text-destructive" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
                        {r.follow_up_date}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.notification_channel ?? "auto"}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.notified ? (
                        <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Sent</Badge>
                      ) : overdue ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!r.notified && (
                        <Button size="sm" onClick={() => sendNow(r)}>
                          <Send className="mr-1 h-3 w-3" /> Send now
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
