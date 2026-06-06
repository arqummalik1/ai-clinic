/**
 * Deterministic "trust" signals for AI-structured prescriptions.
 *
 * Rather than trusting an LLM's self-reported confidence (unreliable), we check
 * whether a value is actually supported by what the doctor SAID (the raw voice
 * transcript). A medicine/diagnosis that appears in the transcript is "heard";
 * one the model completed or mis-heard is flagged for a quick verify.
 */

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** True if `term` is reasonably supported by the transcript. */
export function transcriptSupports(transcript: string | undefined | null, term: string | undefined | null): boolean {
  if (!transcript || !term) return false;
  const t = norm(transcript);
  const q = norm(term);
  if (!q || !t) return false;
  if (t.includes(q)) return true;

  // Token-level: every meaningful token (len >= 4) of the term is present.
  const tokens = q.split(" ").filter((w) => w.length >= 4);
  if (tokens.length > 0 && tokens.every((w) => t.includes(w))) return true;

  // Fallback: a distinctive first token (drug stems are often distinctive).
  const first = q.split(" ")[0];
  return first.length >= 5 && t.includes(first);
}

export type TrustLevel = "heard" | "verify";

export interface MedicineTrust {
  /** name supported by the transcript */
  nameHeard: boolean;
  /** dosage explicitly given (not blank / "as directed") */
  dosageExplicit: boolean;
  level: TrustLevel;
}

const INFERRED_DOSAGES = new Set(["", "as directed", "as advised", "as needed"]);

export function assessMedicine(transcript: string | undefined | null, name: string, dosage: string): MedicineTrust {
  const nameHeard = transcriptSupports(transcript, name);
  const dosageExplicit = !INFERRED_DOSAGES.has(norm(dosage));
  const level: TrustLevel = nameHeard && dosageExplicit ? "heard" : "verify";
  return { nameHeard, dosageExplicit, level };
}

/**
 * Returns a short transcript snippet around the first match of `term`, with the
 * matched portion wrapped in « » so the UI can show "the words you said".
 * Returns null when the term isn't found in the transcript.
 */
export function transcriptEvidence(transcript: string | undefined | null, term: string | undefined | null, window = 45): string | null {
  if (!transcript || !term) return null;
  const t = transcript;
  const q = term.trim();
  if (!q) return null;
  const idx = t.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) {
    // try first distinctive token
    const first = norm(term).split(" ")[0];
    if (first.length >= 5) {
      const i2 = t.toLowerCase().indexOf(first);
      if (i2 !== -1) return clip(t, i2, first.length, window);
    }
    return null;
  }
  return clip(t, idx, q.length, window);
}

function clip(text: string, idx: number, len: number, window: number): string {
  const start = Math.max(0, idx - window);
  const end = Math.min(text.length, idx + len + window);
  const before = (start > 0 ? "…" : "") + text.slice(start, idx);
  const match = text.slice(idx, idx + len);
  const after = text.slice(idx + len, end) + (end < text.length ? "…" : "");
  return `${before}«${match}»${after}`;
}
