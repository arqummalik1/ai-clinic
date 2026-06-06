import { describe, it, expect } from "vitest";
import { cn, formatCurrencyINR, todayISO, addDaysISO } from "@/lib/utils";

describe("cn", () => {
  it("merges class names and dedupes conflicting Tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });
});

describe("formatCurrencyINR", () => {
  it("formats with the rupee symbol and Indian grouping", () => {
    expect(formatCurrencyINR(500)).toBe("₹500");
    expect(formatCurrencyINR(100000)).toBe("₹1,00,000");
  });
});

describe("todayISO", () => {
  it("returns a YYYY-MM-DD string", () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("addDaysISO", () => {
  it("adds days and returns a YYYY-MM-DD string", () => {
    // Construct in LOCAL time (the fn uses local date parts) so the test is TZ-stable.
    const from = new Date(2026, 0, 1); // 2026-01-01 local
    expect(addDaysISO(7, from)).toBe("2026-01-08");
  });

  it("rolls over month boundaries", () => {
    const from = new Date(2026, 0, 28); // 2026-01-28 local
    expect(addDaysISO(5, from)).toBe("2026-02-02");
  });
});
