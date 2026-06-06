"use client";

import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { todayISO } from "@/lib/utils";

export function AppointmentDateFilter({ selectedDate }: { selectedDate: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const today = todayISO();

  const goTo = (date: string) => {
    if (!date) return;
    if (date === today) router.push(pathname);
    else router.push(`${pathname}?date=${date}`);
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={selectedDate}
        max={today}
        onChange={(e) => goTo(e.target.value)}
        className="w-44"
        aria-label="Filter appointments by date"
      />
      {selectedDate !== today && (
        <Button variant="outline" size="sm" onClick={() => goTo(today)}>
          Today
        </Button>
      )}
    </div>
  );
}
