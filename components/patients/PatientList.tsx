"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePatientViewModel } from "@/hooks/usePatientViewModel";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Users, Phone, User } from "lucide-react";
import { getBrowserApiClient } from "@/lib/infrastructure/api/client";
import { cn } from "@/lib/utils";

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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
        <Input
          className="pl-9 glass-card border-brand-300 focus:border-brand-500 focus:ring-brand-500"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && patients.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl border py-16">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400 mb-3" />
          <p className="text-sm text-brand-600">Loading patients…</p>
        </div>
      )}

      {!loading && patients.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center rounded-xl border py-16 text-center">
          <Users className="h-10 w-10 text-brand-300 mb-3" />
          <p className="text-sm text-brand-600">No patients found.</p>
        </div>
      )}

      {/* Efficient table view for thousands of patients */}
      {patients.length > 0 && (
        <div className="glass-card rounded-xl border overflow-hidden">
          {loading && (
            <div className="h-1 w-full overflow-hidden bg-brand-100">
              <div className="h-full w-1/3 animate-pulse bg-brand-400" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-brand-50 to-brand-100 border-b border-brand-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Age
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">
                    Alerts
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {patients.map((p) => (
                  <tr 
                    key={p.id}
                    className="transition-all duration-200 hover:bg-brand-50/50 cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`${basePath}/${p.id}`} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/30 group-hover:shadow-lg group-hover:shadow-brand-500/40 transition-shadow">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-brand-900">{p.full_name}</div>
                          {p.email && (
                            <div className="text-xs text-brand-600">{p.email}</div>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`${basePath}/${p.id}`} className="flex items-center gap-2 text-sm text-brand-700">
                        <Phone className="h-4 w-4 text-brand-500" />
                        {p.phone ?? "—"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`${basePath}/${p.id}`} className="text-sm text-brand-700">
                        {p.age ? `${p.age}y` : "—"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link href={`${basePath}/${p.id}`}>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          p.gender === "male" && "bg-brand-100 text-brand-700",
                          p.gender === "female" && "bg-red-100 text-red-700",
                          !p.gender && "bg-brand-50 text-brand-600"
                        )}>
                          {p.gender ?? "—"}
                        </span>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`${basePath}/${p.id}`}>
                        {p.allergies && p.allergies.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            ⚠ {p.allergies.join(", ")}
                          </span>
                        ) : (
                          <span className="text-sm text-brand-400">—</span>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-brand-200 bg-brand-50/50 px-6 py-3">
            <p className="text-xs text-brand-600">
              Showing {patients.length} patient{patients.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}