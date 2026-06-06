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
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="glass-card rounded-xl border p-12 text-center">
          <p className="text-brand-700">You don't have access to earnings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-brand-800 to-brand-900 bg-clip-text text-transparent">
          Your earnings
        </h1>
        <p className="text-sm text-brand-600 mt-1">Revenue from completed consultations</p>
      </div>
      <EarningsChart doctorId={user.id} />
    </div>
  );
}
