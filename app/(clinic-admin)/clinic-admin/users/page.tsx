import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Stethoscope, ClipboardList } from "lucide-react";

export default async function StaffListPage() {
  const supabase = await createClient();
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, phone, is_active, created_at")
    .in("role", ["doctor", "receptionist"])
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
          <p className="text-sm text-muted-foreground">Doctors and receptionists in your clinic</p>
        </div>
        <Link href="/clinic-admin/users/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add staff
          </Button>
        </Link>
      </div>

      {(!users || users.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <ClipboardList className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="font-medium">No staff yet</p>
            <p className="text-sm text-muted-foreground">Add your first doctor or receptionist.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 capitalize">
                        {u.role === "doctor" && <Stethoscope className="h-3 w-3" />}
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>{u.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "success" : "secondary"}>
                        {u.is_active ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clinic-admin/users/${u.id}`} className="text-sm text-primary hover:underline">
                        Manage
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
