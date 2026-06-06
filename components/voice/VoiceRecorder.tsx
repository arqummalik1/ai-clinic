"use client";

import { useState } from "react";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Info } from "lucide-react";
import { toast } from "sonner";
import type { StructuredPrescription } from "@/lib/ai";
import { ECGVisualizer } from "./ECGVisualizer";

type Step = "idle" | "recording" | "transcribing" | "generating" | "done" | "error";

interface VoiceRecorderProps {
  language?: string;
  patientContext?: {
    age?: number | null;
    gender?: string | null;
    allergies?: string[] | null;
    lastDiagnosis?: string | null;
  };
  onPrescriptionGenerated: (rx: StructuredPrescription & { rawVoiceText: string }) => void;
}

export function VoiceRecorder({ language = "en", patientContext, onPrescriptionGenerated }: VoiceRecorderProps) {
  const recorder = useVoiceRecorder();
  const [step, setStep] = useState<Step>("idle");
  const [transcription, setTranscription] = useState("");
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const fail = (message: string) => {
    setErrMsg(message);
    setStep("error");
    toast.error(message);
  };

  const start = async () => {
    setErrMsg(null);
    setTranscription("");
    setStep("recording");
    await recorder.startRecording();
    // If startRecording surfaced an error (permission denied, no device, etc.)
    // bail out immediately so the user gets actionable feedback instead of a
    // recording state that never receives audio.
    if (recorder.error) {
      fail(recorder.error);
    }
  };

  const stopAndProcess = async () => {
    setStep("transcribing");
    let blob: Blob | null = null;
    try {
      blob = await recorder.stopRecording();
    } catch (err) {
      fail(err instanceof Error ? err.message : "Could not stop the recorder");
      return;
    }

    if (!blob || blob.size === 0) {
      fail("No audio captured. Please tap record again and speak clearly.");
      return;
    }
    if (blob.size < 1500) {
      fail("Recording was too short. Hold the button a little longer.");
      return;
    }

    try {
      const extFromType = blob.type.includes("mp4")
        ? "mp4"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";
      const fd = new FormData();
      fd.append("audio", blob, `recording.${extFromType}`);
      fd.append("language", language);

      const tRes = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
      if (!tRes.ok) {
        const errJson = await tRes.json().catch(() => ({}));
        throw new Error(errJson?.error ?? `Transcription failed (HTTP ${tRes.status})`);
      }
      const { transcription: text } = (await tRes.json()) as { transcription: string };
      if (!text || !text.trim()) {
        throw new Error("No speech detected. Try recording again, a bit closer to the mic.");
      }
      setTranscription(text);

      setStep("generating");
      const pRes = await fetch("/api/ai/prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription: text,
          patientAge: patientContext?.age,
          patientGender: patientContext?.gender,
          allergies: patientContext?.allergies,
          lastDiagnosis: patientContext?.lastDiagnosis,
          language,
        }),
      });
      if (!pRes.ok) {
        const errJson = await pRes.json().catch(() => ({}));
        throw new Error(errJson?.error ?? `AI generation failed (HTTP ${pRes.status})`);
      }
      const { prescription } = (await pRes.json()) as { prescription: StructuredPrescription };
      setStep("done");
      onPrescriptionGenerated({ ...prescription, rawVoiceText: text });
    } catch (err) {
      fail(err instanceof Error ? err.message : "AI pipeline failed");
    }
  };

  const reset = () => {
    setStep("idle");
    setTranscription("");
    setErrMsg(null);
    recorder.clearRecording();
  };

  return (
    <div className="w-full flex flex-col gap-6 rounded-2xl border bg-white p-6 shadow-sm">
      <ECGVisualizer
        step={step === "recording" ? "recording" : step}
        stream={recorder.stream}
        duration={recorder.duration}
        errorMsg={errMsg}
      />

      <div className="min-h-12 text-center">
        {step === "idle" && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Press to record. Speak the prescription clearly.
            </p>
            <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              First time? Your browser will ask for microphone permission.
            </p>
          </div>
        )}
        {step === "recording" && (
          <p className="text-sm font-medium text-red-500">Recording — tap stop when done</p>
        )}
        {step === "transcribing" && (
          <p className="text-sm text-indigo-600">Transcribing your voice…</p>
        )}
        {step === "generating" && (
          <p className="text-sm text-purple-650">AI is structuring the prescription…</p>
        )}
        {step === "done" && (
          <p className="text-sm font-medium text-green-700">Prescription ready — review below</p>
        )}
        {step === "error" && (
          <p className="text-sm text-destructive">{errMsg ?? recorder.error ?? "Something went wrong"}</p>
        )}
      </div>

      {transcription && (
        <div className="max-h-24 w-full overflow-y-auto rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Transcription:</span> {transcription}
        </div>
      )}

      <div className="flex gap-2 justify-center">
        {step === "idle" && (
          <Button onClick={start} size="xl" className="bg-red-500 hover:bg-red-600">
            <Mic className="mr-2 h-5 w-5" /> Start recording
          </Button>
        )}
        {recorder.isRecording && (
          <Button onClick={stopAndProcess} size="xl" variant="outline">
            <MicOff className="mr-2 h-5 w-5" /> Stop & generate
          </Button>
        )}
        {(step === "done" || step === "error") && (
          <Button onClick={reset} variant="ghost">
            Record again
          </Button>
        )}
      </div>
    </div>
  );
}
