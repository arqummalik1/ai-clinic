"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export type MicPermissionResult = { ok: boolean; error?: string };

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stopResolveRef = useRef<((blob: Blob) => void) | null>(null);
  const mimeRef = useRef<string>("audio/webm");

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const pickMimeType = (): string => {
    if (typeof MediaRecorder === "undefined") return "audio/webm";
    // Safari often only supports audio/mp4; try that first if webm isn't supported.
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4;codecs=mp4a.40.2",
      "audio/mp4",
      "audio/ogg",
    ];
    for (const m of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(m)) return m;
      } catch {
        // ignore
      }
    }
    return "audio/webm";
  };

  /**
   * Probe microphone permission without retaining the stream. Useful so the
   * UI can show a clear "Allow microphone" prompt before the user taps record.
   */
  const requestMicAccess = useCallback(async (): Promise<MicPermissionResult> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return { ok: true };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Microphone access denied. Allow mic permissions in your browser and try again.";
      return { ok: false, error: message };
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioBlob(null);
    chunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStream(stream);
      const mimeType = pickMimeType();
      mimeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        setAudioBlob(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setStream(null);
        const resolver = stopResolveRef.current;
        stopResolveRef.current = null;
        if (resolver) resolver(blob);
      };
      mediaRecorder.onerror = (ev) => {
        const msg =
          (ev as unknown as { error?: Error }).error?.message ?? "Recorder error";
        setError(msg);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Microphone access denied. Allow mic permissions and try again.";
      console.error("[mic] startRecording failed:", message);
      setError(message);
    }
  }, []);

  /**
   * Stop the recording and resolve with the final Blob once `onstop` has fired.
   * If the recorder isn't running, resolves immediately with `null`.
   */
  const stopRecording = useCallback((): Promise<Blob | null> => {
    const recorder = mediaRecorderRef.current;
    setIsRecording(false);
    setStream(null);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve(null);
    }
    return new Promise<Blob | null>((resolve) => {
      const timeoutId = setTimeout(() => {
        stopResolveRef.current = null;
        resolve(null);
      }, 5000);
      stopResolveRef.current = (blob) => {
        clearTimeout(timeoutId);
        resolve(blob);
      };
      try {
        recorder.stop();
      } catch (err) {
        clearTimeout(timeoutId);
        stopResolveRef.current = null;
        console.error("[mic] stop() threw:", err);
        resolve(null);
      }
    });
  }, []);

  const clearRecording = useCallback(() => {
    setAudioBlob(null);
    setDuration(0);
    setError(null);
  }, []);

  return {
    isRecording,
    audioBlob,
    duration,
    error,
    stream,
    startRecording,
    stopRecording,
    clearRecording,
    requestMicAccess,
  };
}
