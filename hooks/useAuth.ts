"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Tables } from "@/types/database";
import { signOutAction } from "@/app/(auth)/login/actions";

type UserProfile = Tables<"users">;

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetchedRef = useRef(false);
  const mountedRef = useRef(true);

  // 1. Manage auth session subscription and initial load
  useEffect(() => {
    mountedRef.current = true;
    const supabase = createClient();

    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const u = session?.user ?? null;
        if (mountedRef.current) {
          setUser(u);
        }
      } catch (err) {
        console.error("[useAuth] Unhandled auth session loading error:", err);
      }
    };
    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mountedRef.current) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Fetch user profile when user state changes
  useEffect(() => {
    if (!user) {
      // Defer state updates out of the synchronous effect body.
      const reset = async () => {
        if (!mountedRef.current) return;
        setProfile(null);
        setLoading(false);
      };
      reset();
      return;
    }

    // Avoid refetching if already fetched for this user
    if (profileFetchedRef.current) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single();
        if (error) {
          console.error("[useAuth] Supabase error loading profile:", error);
          // If RLS blocks, fetch minimal data using a fallback
          const { data: fallback } = await supabase
            .from("users")
            .select("id, role, full_name, email")
            .eq("id", user.id)
            .maybeSingle();
          if (fallback && mountedRef.current) {
            setProfile(fallback as UserProfile | null);
          }
        } else if (mountedRef.current) {
          setProfile(data as UserProfile | null);
        }
      } catch (err) {
        console.error("[useAuth] Profile loader exception:", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          profileFetchedRef.current = true;
        }
      }
    };

    loadProfile();

    return () => {
      // no-op
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const signOut = async () => {
    await signOutAction();
  };

  return { user, profile, loading, signOut };
}
