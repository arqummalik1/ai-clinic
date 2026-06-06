"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePatientViewModel } from "@/hooks/usePatientViewModel";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Users } from "lucide-react";
import { getBrowserApiClient } from "@/lib/infrastructure/api/client";

export function PatientList({ basePath }: { basePath: string }) {
  const { patients, fetchPatientsList, loading } = usePatientViewModel();
  const [search, setSearch] = useState("");
  const searchRef = useRef(search);
  const initialFetchDone = useRef(false);

  // Keep a ref of the latest search term for the realtime callback,
  // updated in an effect (not during render).
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // Debounced search fetch - only depends on search text, not fetchPatientsList
  useEffect(() => {
    const t = setTimeout(() => {
      fetchPatientsList(search || undefined);
      initialFetchDone.current = true;
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Real-time subscription - stable, never re-creates
  useEffect(() => {
    const supabase = getBrowserApiClient();
    const channel = supabase
      .channel("patients-list-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patients" },
        () => {
          fetchPatientsList(searchRef.current || undefined);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial fetch (runs once after mount)
  useEffect(() => {
    if (!initialFetchDone.current) {
      fetchPatientsList(undefined);
      initialFetchDone.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && patients.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-12 shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Loading patients…</p>
        </div>
      )}

      {!loading && patients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No patients found.</p>
          </CardContent>
        </Card>
      )}

      {/* Show existing patients even while loading (for refresh) */}
      {patients.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {loading && (
            <div className="col-span-full mb-2">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/30" />
              </div>
            </div>
          )}
          {patients.map((p) => (
            <Link key={p.id} href={`${basePath}/${p.id}`}>
              <Card className="cursor-pointer transition hover:shadow-md">
                <CardContent className="p-4">
                  <p className="font-medium">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.phone ?? "—"} · {p.age ? `${p.age}y` : "—"} · {p.gender ?? "—"}
                  </p>
                  {p.allergies && p.allergies.length > 0 && (
                    <p className="mt-1 text-xs text-yellow-700">⚠ {p.allergies.join(", ")}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}