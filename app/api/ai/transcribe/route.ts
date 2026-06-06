import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai/providers/groq";
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
      console.error("[transcribe] GROQ_API_KEY is missing");
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
      console.warn("[transcribe] No authenticated user (auth cookie not received).");
      return NextResponse.json({ error: "Unauthorized — please sign in again." }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    if (!audioFile) {
      return NextResponse.json({ error: "No audio file in request" }, { status: 400 });
    }
    if (audioFile.size < 1000) {
      return NextResponse.json(
        { error: "No audio captured — please try recording again and speak clearly." },
        { status: 400 },
      );
    }

    const language = (formData.get("language") as string | null) || "en";

    console.log(
      `[transcribe] user=${user.id} mime=${audioFile.type || "?"} size=${audioFile.size}B language=${language}`,
    );

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const transcription = await withTimeout(
      transcribeAudio(buffer, audioFile.type || "audio/webm", language),
      "Groq Whisper",
    );

    console.log(`[transcribe] success len=${(transcription ?? "").length}`);
    return NextResponse.json({ transcription });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Transcription failed";
    console.error("[transcribe] error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
