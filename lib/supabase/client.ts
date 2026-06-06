import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.error(
      "[Supabase Client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in the browser environment.",
    );
  }
  return createBrowserClient<Database>(
    url!,
    anonKey!,
    {
      auth: {
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<void>) => fn(),
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
