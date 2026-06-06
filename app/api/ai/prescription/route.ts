import { NextRequest, NextResponse } from "next/server";
import { generatePrescription } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${TIMEOUT_MS / 1000}s`)),
      TIMEOUT_MS,
    );
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error("[prescription] GROQ_API_KEY is missing");
      return NextResponse.json(
        { error: "Server is missing GROQ_API_KEY — set it in .env.local and restart." },
        { status: 500 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn("[prescription] No authenticated user.");
      return NextResponse.json({ error: "Unauthorized — please sign in again." }, { status: 401 });
    }

    const body = await req.json();
    const { transcription, patientAge, patientGender, allergies, lastDiagnosis, existingConditions, language } = body;
    if (!transcription || typeof transcription !== "string" || !transcription.trim()) {
      return NextResponse.json({ error: "Transcription is required" }, { status: 400 });
    }

    console.log(`[prescription] user=${user.id} transcriptionLen=${transcription.length} language=${language || "en"}`);

    const prescription = await withTimeout(
      generatePrescription(
        { transcription, patientAge, patientGender, allergies, lastDiagnosis, existingConditions, language },
        "groq",
      ),
      "Groq LLaMA",
    );

    return NextResponse.json({ prescription });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Prescription generation failed";
    console.error("[prescription] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
