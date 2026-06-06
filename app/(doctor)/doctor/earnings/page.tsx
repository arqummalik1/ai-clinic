import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EarningsChart } from "@/components/earnings/EarningsChart";

export default async function DoctorEarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: perms } = await supabase
    .from("user_permissions")
    .select("can_view_earnings")
    .eq("user_id", user.id)
    .maybeSingle();

  if (perms && perms.can_view_earnings === false) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <p className="text-muted-foreground">You don&apos;t have access to earnings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Your earnings</h1>
        <p className="text-sm text-muted-foreground">Revenue from completed consultations</p>
      </div>
      <EarningsChart doctorId={user.id} />
    </div>
  );
}
