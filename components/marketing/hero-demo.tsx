"use client";

import { useEffect, useState } from "react";
import { Mic, FileText, Mail, Printer, BellRing, Check, Sparkles, Loader2 } from "lucide-react";

/* ── Timeline (1 frame = 150ms) ─────────────────────────────────────── */
const WORD_STEP = 3;
const TYPE_START = 3;
const ROW_STEP = 3;
const ROW_STEP_START = 30;
const CHIP_STEP = 4;
const CHIP_START = 47;
const STRUCT_START = 26;
const FILL_START = ROW_STEP_START;
const CYCLE = 76;

const WORDS = [
  "Viral fever.",
  "Paracetamol 500mg,",
  "three times daily",
  "for five days.",
  "CBC.",
  "Plenty of fluids.",
  "Follow up in three days.",
];

const ROWS = [
  { label: "Diagnosis", value: "Viral fever" },
  { label: "Rx", value: "Paracetamol 500mg · TID · 5 days" },
  { label: "Lab test", value: "CBC" },
  { label: "Advice", value: "Plenty of fluids" },
  { label: "Follow-up", value: "In 3 days" },
];

const CHIPS = [
  { icon: Mail, label: "Emailed" },
  { icon: Printer, label: "Printed" },
  { icon: BellRing, label: "Reminder set" },
];

const BAR_HEIGHTS = [5, 9, 14, 8, 18, 12, 22, 10, 16, 7, 13, 6, 11, 17, 9, 4];

const clampCount = (frame: number, start: number, step: number, max: number) =>
  frame < start ? 0 : Math.min(max, Math.floor((frame - start) / step) + 1);

export function HeroDemo() {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % CYCLE), 150);
    return () => clearInterval(id);
  }, []);

  const wordsShown = clampCount(frame, TYPE_START, WORD_STEP, WORDS.length);
  const speaking = frame < STRUCT_START;
  const structuring = frame >= STRUCT_START && frame < FILL_START;
  const rowsShown = clampCount(frame, FILL_START, ROW_STEP, ROWS.length);
  const chipsShown = clampCount(frame, CHIP_START, CHIP_STEP, CHIPS.length);
  const allRows = rowsShown >= ROWS.length;

  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <div className="rounded-3xl border border-ink-200 bg-card p-3 shadow-2xl shadow-brand-900/10">
        <div className="rounded-2xl bg-gradient-to-br from-ink-50 to-brand-50/70 p-5 sm:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            {/* ── Speaking ── */}
            <div className="flex flex-col rounded-xl border border-ink-200 bg-card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                    <Mic className="h-4 w-4" />
                  </span>
                  Doctor speaking
                </div>
                {speaking && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-red-500">
                    <span className="relative inline-flex h-2 w-2 text-red-500">
                      <span className="live-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    REC
                  </span>
                )}
              </div>

              {/* Live equalizer */}
              <div className="mt-4 flex h-12 items-end gap-1" aria-hidden>
                {BAR_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="eq-bar w-1.5 flex-1 rounded-full bg-accent-400/80"
                    style={{
                      height: `${Math.max(20, h * 4)}%`,
                      animationDelay: `${i * 60}ms`,
                      animationDuration: `${680 + (i % 5) * 110}ms`,
                      animationPlayState: speaking ? "running" : "paused",
                      opacity: speaking ? 1 : 0.35,
                    }}
                  />
                ))}
              </div>

              {/* Typed transcript */}
              <p className="mt-4 min-h-[72px] text-sm leading-relaxed text-ink-700">
                <span className="text-ink-400">&ldquo;</span>
                {WORDS.slice(0, wordsShown).join(" ")}
                {speaking && <span className="caret-blink ml-0.5 font-semibold text-accent-600">|</span>}
                {wordsShown >= WORDS.length && <span className="text-ink-400">&rdquo;</span>}
              </p>
            </div>

            {/* ── Connector ── */}
            <div className="flex items-center justify-center">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-full text-white transition-colors duration-500 ${
                  structuring ? "bg-brand-500" : "bg-brand-600"
                }`}
              >
                {structuring ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </span>
            </div>

            {/* ── Structured ── */}
            <div className="flex flex-col rounded-xl border border-ink-200 bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <FileText className="h-4 w-4" />
                </span>
                Structured prescription
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                {ROWS.map((r, i) => {
                  const visible = i < rowsShown;
                  return (
                    <div
                      key={r.label}
                      className={`flex items-baseline justify-between gap-3 rounded-md px-1 ${
                        visible ? "pop-in" : "opacity-0"
                      }`}
                    >
                      <dt className="text-ink-400">{r.label}</dt>
                      <dd className="text-right font-medium text-ink-800">{r.value}</dd>
                    </div>
                  );
                })}
              </dl>

              {/* Dispatch chips */}
              <div className="mt-4 min-h-[34px] border-t border-ink-200 pt-3">
                {allRows && (
                  <div className="flex flex-wrap gap-1.5">
                    {CHIPS.slice(0, chipsShown).map((c) => {
                      const Icon = c.icon;
                      return (
                        <span
                          key={c.label}
                          className="pop-in inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2 py-1 text-[11px] font-semibold text-brand-700"
                        >
                          <Icon className="h-3 w-3" />
                          {c.label}
                          <Check className="h-3 w-3 text-emerald-600" />
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Caption */}
          <p className="mt-5 text-center text-xs font-medium text-ink-500">
            One spoken sentence → a finished, branded prescription. In seconds.
          </p>
        </div>
      </div>
    </div>
  );
}
