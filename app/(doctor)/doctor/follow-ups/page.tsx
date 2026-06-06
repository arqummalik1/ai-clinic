import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FollowUpManager } from "@/components/follow-ups/FollowUpManager";

export default async function DoctorFollowUpsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">Patients due for a follow-up visit or reminder</p>
      </div>
      <FollowUpManager scope="doctor" doctorId={user.id} />
    </div>
  );
}
