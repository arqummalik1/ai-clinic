import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_ROUTE_MAP } from "@/lib/supabase/middleware";

type Role = "super_admin" | "clinic_admin" | "doctor" | "receptionist";

export async function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role as Role | undefined;
  if (!role) redirect("/login");
  if (!allow.includes(role)) redirect(`${ROLE_ROUTE_MAP[role]}/dashboard`);

  return <>{children}</>;
}
