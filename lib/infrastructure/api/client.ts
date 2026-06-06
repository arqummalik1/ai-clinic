import { createClient } from "@/lib/supabase/client";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

let clientInstance: SupabaseClient<Database> | null = null;

export function getBrowserApiClient(): SupabaseClient<Database> {
  if (!clientInstance) {
    clientInstance = createClient();
  }
  return clientInstance;
}
