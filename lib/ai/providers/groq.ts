import Groq from "groq-sdk";
import { buildPrescriptionPrompt } from "../prompts/prescription";
import type { PrescriptionInput, StructuredPrescription } from "../index";

function getClient() {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string, language?: string): Promise<string> {
  const groq = getClient();
  const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
  const file = new File([new Uint8Array(audioBuffer)], `audio.${ext}`, { type: mimeType });
  const result = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    language: language || "en",
    response_format: "text",
  });
  return result as unknown as string;
}

export async function generateWithGroq(input: PrescriptionInput): Promise<StructuredPrescription> {
  const groq = getClient();
  const prompt = buildPrescriptionPrompt(input);
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "You are a careful medical assistant AI. Output strictly valid JSON only — no markdown fences, no explanation, no extra text.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1500,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");
  return JSON.parse(content) as StructuredPrescription;
}
