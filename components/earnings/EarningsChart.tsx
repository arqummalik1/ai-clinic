"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useEarnings, type EarningsFilter } from "@/hooks/useEarnings";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyINR, cn } from "@/lib/utils";

export function EarningsChart({ doctorId }: { doctorId?: string }) {
  const [filter, setFilter] = useState<EarningsFilter>("weekly");
  const { data, total } = useEarnings(filter, doctorId);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total earnings</p>
            <p className="text-3xl font-bold">{formatCurrencyINR(total)}</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-secondary p-1">
            {(["daily", "weekly", "monthly"] as EarningsFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm font-medium transition-all",
                  filter === f ? "bg-background shadow" : "text-muted-foreground",
                )}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="earnings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(224 71% 56%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(224 71% 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip formatter={(v) => [formatCurrencyINR(Number(v)), "Earnings"]} />
            <Area type="monotone" dataKey="amount" stroke="hsl(224 71% 56%)" fill="url(#earnings)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
