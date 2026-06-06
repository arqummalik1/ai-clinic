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
    <div className="glass-card rounded-xl border">
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-brand-600">Total earnings</p>
            <p className="text-3xl font-bold text-brand-900 mt-1">{formatCurrencyINR(total)}</p>
          </div>
          <div className="flex gap-1 rounded-lg bg-brand-100/80 p-1">
            {(["daily", "weekly", "monthly"] as EarningsFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-300",
                  filter === f 
                    ? "bg-white shadow-md text-brand-900" 
                    : "text-brand-600 hover:text-brand-900",
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
                <stop offset="5%" stopColor="hsl(220 70% 55%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(220 70% 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 65% 38%)" }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(220 65% 38%)" }} tickLine={false} axisLine={false} />
            <Tooltip 
              formatter={(v) => [formatCurrencyINR(Number(v)), "Earnings"]}
              contentStyle={{ 
                background: "rgba(255, 255, 255, 0.95)", 
                border: "1px solid rgba(220, 230, 245, 0.5)",
                borderRadius: "8px",
                backdropFilter: "blur(10px)"
              }}
            />
            <Area type="monotone" dataKey="amount" stroke="hsl(220 70% 48%)" fill="url(#earnings)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
