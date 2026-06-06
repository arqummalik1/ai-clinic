import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/ratelimit";

describe("checkRateLimit", () => {
  it("allows requests up to the limit, then blocks", () => {
    const key = `test:${Math.random()}`;
    const limit = 3;
    const window = 60_000;

    expect(checkRateLimit(key, limit, window).allowed).toBe(true); // 1
    expect(checkRateLimit(key, limit, window).allowed).toBe(true); // 2
    expect(checkRateLimit(key, limit, window).allowed).toBe(true); // 3
    const blocked = checkRateLimit(key, limit, window); // 4 → blocked
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks remaining count correctly", () => {
    const key = `test:${Math.random()}`;
    const first = checkRateLimit(key, 5, 60_000);
    expect(first.remaining).toBe(4);
    const second = checkRateLimit(key, 5, 60_000);
    expect(second.remaining).toBe(3);
  });

  it("resets after the window elapses", () => {
    const key = `test:${Math.random()}`;
    // Tiny window so it expires immediately on the next tick.
    expect(checkRateLimit(key, 1, 1).allowed).toBe(true);
    // Busy-wait a couple ms to cross the window boundary.
    const start = Date.now();
    while (Date.now() - start < 5) { /* spin */ }
    expect(checkRateLimit(key, 1, 1).allowed).toBe(true);
  });
});
