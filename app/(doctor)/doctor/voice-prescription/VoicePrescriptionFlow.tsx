"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VoiceRecorder } from "@/components/voice/VoiceRecorder";
import { PrescriptionEditor } from "@/components/prescriptions/PrescriptionEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { StructuredPrescription, Vitals, Medicine } from "@/lib/ai";
import { saveAndShipPrescription, getDoctorMedicineFavorites, type FavoriteMedicine } from "./actions";
import { Save, Mail, AlertTriangle, User, Loader2, Globe, Mic, MicOff, Keyboard, Sparkles, Volume2, Sliders, Clock, FileText, Smartphone } from "lucide-react";
import { ECGVisualizer } from "@/components/voice/ECGVisualizer";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { PatientTimeline, type PrescriptionEvent, type AppointmentEvent, type VitalsEvent, type FollowUpEvent } from "@/components/patients/PatientTimeline";

function mergeVitals(prev: Vitals | undefined, next: Vitals | undefined): Vitals {
  if (!prev) return next || {};
  if (!next) return prev;
  const merged: Vitals = { ...prev };
  (Object.keys(next) as Array<keyof Vitals>).forEach((key) => {
    const val = next[key];
    if (val !== null && val !== undefined) {
      (merged as Record<keyof Vitals, number | null>)[key] = val as number | null;
    }
  });
  if (merged.weightKg && merged.heightCm) {
    merged.bmi = Number((merged.weightKg / ((merged.heightCm / 100) ** 2)).toFixed(1));
  }
  return merged;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface PatientCtx {
  id: string;
  full_name: string;
  age?: number | null;
  gender?: string | null;
  allergies?: string[] | null;
  email?: string | null;
  phone?: string | null;
}

const LANGUAGES = [
  { code: "en", name: "English (US/UK)" },
  { code: "es", name: "Spanish (Español)" },
  { code: "hi", name: "Hindi (हिन्दी)" },
  { code: "fr", name: "French (Français)" },
  { code: "de", name: "German (Deutsch)" },
  { code: "ar", name: "Arabic (العربية)" },
  { code: "pt", name: "Portuguese (Português)" },
];

const DEFAULT_MIC_MODE = "auto-stop";
const DEFAULT_AI_PAUSE_SEC = 3;
const DEFAULT_MIC_STOP_SEC = 5;

// Top-level prescription fields that can be individually locked from AI overwrite.
const FIELD_KEYS: (keyof StructuredPrescription)[] = [
  "diagnosis", "chiefComplaint", "medicines", "labTests", "advice", "followUpDays", "clinicalSummary", "vitals",
];

const EMPTY_RX: StructuredPrescription = {
  diagnosis: "",
  chiefComplaint: "",
  medicines: [],
  labTests: [],
  advice: "",
  followUpDays: null,
  clinicalSummary: "",
  vitals: {
    bpSystolic: null,
    bpDiastolic: null,
    weightKg: null,
    temperatureF: null,
    pulseRate: null,
    spo2: null,
    heightCm: null,
    bmi: null,
  },
};

interface VoicePrescriptionFlowProps {
  patientId?: string;
  appointmentId?: string;
}

type FlowView = "loading" | "picker" | "patient" | "error";

export function VoicePrescriptionFlow({ patientId: initialPatientId, appointmentId: initialAppointmentId }: VoicePrescriptionFlowProps) {
  const router = useRouter();

  // Internal state management — we manage the selected patient entirely client-side
  // instead of relying on URL navigation (router.replace to the same route doesn't re-render properly)
  const [, setSelectedPatientId] = useState<string | undefined>(initialPatientId);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(initialAppointmentId);

  const [patient, setPatient] = useState<PatientCtx | null>(null);
  const [lastDx, setLastDx] = useState<string | null>(null);
  interface LastRxFull {
    diagnosis: string;
    chiefComplaint: string;
    medicines: Medicine[];
    labTests: string[];
    advice: string;
    followUpDays: number | null;
    clinicalSummary: string;
    createdAt: string;
  }
  const [lastRxFull, setLastRxFull] = useState<LastRxFull | null>(null);
  const [favorites, setFavorites] = useState<FavoriteMedicine[]>([]);
  const [rx, setRx] = useState<StructuredPrescription>(EMPTY_RX);
  const [rawVoice, setRawVoice] = useState<string>("");
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [language, setLanguage] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voice_rx_language");
      if (saved && LANGUAGES.some(l => l.code === saved)) return saved;
    }
    return "en";
  });
  const [view, setView] = useState<FlowView>("loading");
  const [waitingPatients, setWaitingPatients] = useState<{ id: string; full_name: string; appointment_id?: string }[]>([]);
  const [emailToAdd, setEmailToAdd] = useState("");
  const [saving, setSaving] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Notification toggles
  const [sendEmail, setSendEmail] = useState(false);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);

  // Lazy Patient History Dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<{
    prescriptions: PrescriptionEvent[];
    appointments: AppointmentEvent[];
    vitals: VitalsEvent[];
    followUps: FollowUpEvent[];
  }>({ prescriptions: [], appointments: [], vitals: [], followUps: [] });

  // Real-time voice states
  const [workflowMode, setWorkflowMode] = useState<"dictation" | "manual">("dictation");
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isParsingLive, setIsParsingLive] = useState(false);

  const [visualizerStep, setVisualizerStep] = useState<"idle" | "recording" | "transcribing" | "generating" | "done" | "error">("idle");
  const [visualizerStream, setVisualizerStream] = useState<MediaStream | null>(null);
  const [visualizerError, setVisualizerError] = useState<string | null>(null);
  const [dictationDuration, setDictationDuration] = useState(0);

  // Initialize Supabase client once (stable across renders, lint-safe).
  const [supabase] = useState(() => createClient());

  // Dictation customizable settings states (loaded from localStorage with system defaults)
  const [micMode, setMicMode] = useState<"manual" | "auto-stop">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voice_rx_mic_mode");
      if (saved === "manual" || saved === "auto-stop") return saved;
    }
    return DEFAULT_MIC_MODE;
  });

  const [aiPauseDuration, setAiPauseDuration] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voice_rx_ai_pause_sec");
      if (saved) {
        const num = parseFloat(saved);
        if (!isNaN(num) && num >= 1 && num <= 5) return num;
      }
    }
    return DEFAULT_AI_PAUSE_SEC;
  });

  const [micAutoStopDuration, setMicAutoStopDuration] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voice_rx_stop_sec");
      if (saved) {
        const num = parseFloat(saved);
        if (!isNaN(num) && num >= 3 && num <= 10) return num;
      }
    }
    return DEFAULT_MIC_STOP_SEC;
  });

  const [showSettings, setShowSettings] = useState(false);

  // Save settings change to localStorage
  useEffect(() => {
    localStorage.setItem("voice_rx_language", language);
  }, [language]);

  // Load the doctor's personal medicine shelf (Doctor Memory v1) once on mount.
  useEffect(() => {
    let active = true;
    getDoctorMedicineFavorites()
      .then((favs) => { if (active) setFavorites(favs); })
      .catch(() => { /* non-fatal: editor just won't show favorites */ });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem("voice_rx_mic_mode", micMode);
  }, [micMode]);

  useEffect(() => {
    localStorage.setItem("voice_rx_ai_pause_sec", aiPauseDuration.toString());
  }, [aiPauseDuration]);

  useEffect(() => {
    localStorage.setItem("voice_rx_stop_sec", micAutoStopDuration.toString());
  }, [micAutoStopDuration]);

  // Keep refs updated to prevent re-initializing speech recognition on settings adjust
  const micModeRef = useRef(micMode);
  const aiPauseDurationRef = useRef(aiPauseDuration);
  const micAutoStopDurationRef = useRef(micAutoStopDuration);

  useEffect(() => { micModeRef.current = micMode; }, [micMode]);
  useEffect(() => { aiPauseDurationRef.current = aiPauseDuration; }, [aiPauseDuration]);
  useEffect(() => { micAutoStopDurationRef.current = micAutoStopDuration; }, [micAutoStopDuration]);

  // Lazy-load chronological medical journey on history dialog open
  useEffect(() => {
    if (historyOpen && patient && historyData.prescriptions.length === 0) {
      const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
          const [rxRes, aptRes, vitRes, fuRes] = await Promise.all([
            supabase
              .from("prescriptions")
              .select("id, diagnosis, chief_complaint, medicines, lab_tests, advice, pdf_url, is_ai_generated, raw_voice_text, clinical_summary, transcription_language, created_at")
              .eq("patient_id", patient.id)
              .order("created_at", { ascending: false }),
            supabase
              .from("appointments")
              .select("id, appointment_date, status, consultation_fee, notes")
              .eq("patient_id", patient.id)
              .order("appointment_date", { ascending: false })
              .limit(20),
            supabase
              .from("patient_vitals")
              .select("id, bp_systolic, bp_diastolic, weight_kg, temperature_f, pulse_rate, spo2, height_cm, bmi, recorded_at")
              .eq("patient_id", patient.id)
              .order("recorded_at", { ascending: false }),
            supabase
              .from("follow_ups")
              .select("id, follow_up_date, notified, notification_channel, custom_message, notes, created_at")
              .eq("patient_id", patient.id)
              .order("follow_up_date", { ascending: false })
          ]);

          setHistoryData({
            prescriptions: rxRes.data || [],
            appointments: aptRes.data || [],
            vitals: vitRes.data || [],
            followUps: fuRes.data || []
          });
        } catch (err) {
          console.error("Failed to load patient history:", err);
          toast.error("Failed to load medical history");
        } finally {
          setHistoryLoading(false);
        }
      };
      fetchHistory();
    }
  }, [historyOpen, patient, supabase, historyData.prescriptions.length]);

  // Sync visualizer stream with isListening state
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    async function getStream() {
      if (isListening) {
        try {
          const s = await navigator.mediaDevices.getUserMedia({ audio: true });
          activeStream = s;
          setVisualizerStream(s);
        } catch (err) {
          console.warn("[VoicePrescriptionFlow] Visualizer stream failed:", err);
        }
      } else {
        if (activeStream) {
          activeStream.getTracks().forEach(t => t.stop());
          activeStream = null;
        }
        setVisualizerStream(null);
      }
    }
    getStream();
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [isListening]);

  // Sync dictationDuration timer with isListening state
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isListening) {
      interval = setInterval(() => {
        setDictationDuration(d => d + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isListening]);
  
  // Safe initialization of browser SpeechRecognition support (avoids set-state-in-effect)
  const [recognitionSupported] = useState(() => {
    if (typeof window === "undefined") return true;
    const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });

  // Refs for SpeechRecognition & debouncing
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const parseSpeechRef = useRef<string>("");
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs for lifecycle-safe async operations
  const activeRef = useRef(true);

  // --- Edit-protection: track which fields the doctor has manually edited so
  // the live AI re-parse never silently overwrites the doctor's corrections. ---
  const userEditedRef = useRef<Set<keyof StructuredPrescription>>(new Set());
  const [editedFields, setEditedFields] = useState<string[]>([]);
  const rxRef = useRef<StructuredPrescription>(rx);
  useEffect(() => { rxRef.current = rx; }, [rx]);

  // Wraps the editor's onChange: marks any changed field as doctor-edited (locked).
  const handleEditorChange = useCallback((next: StructuredPrescription) => {
    const prev = rxRef.current;
    let changed = false;
    for (const k of FIELD_KEYS) {
      if (JSON.stringify(next[k]) !== JSON.stringify(prev[k])) {
        if (!userEditedRef.current.has(k)) { userEditedRef.current.add(k); changed = true; }
      }
    }
    if (changed) setEditedFields(Array.from(userEditedRef.current));
    setRx(next);
  }, []);
  // Clears all edit locks (new patient / fresh start).
  const resetEditLocks = useCallback(() => {
    userEditedRef.current = new Set();
    setEditedFields([]);
  }, []);

  // Live parsing endpoint connector
  const triggerLiveParsing = useCallback(async (text: string) => {
    if (!text.trim() || !patient) return;
    setIsParsingLive(true);
    setVisualizerStep("generating");
    setVisualizerError(null);
    parseSpeechRef.current = text;
    try {
      const pRes = await fetch("/api/ai/prescription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcription: text,
          patientAge: patient.age,
          patientGender: patient.gender,
          allergies: patient.allergies,
          lastDiagnosis: lastDx,
          language: language,
        }),
      });
      if (pRes.ok) {
        const { prescription } = await pRes.json();
        if (prescription) {
          const edited = userEditedRef.current;
          setRx(prev => ({
            ...prev,
            diagnosis: edited.has("diagnosis") ? prev.diagnosis : (prescription.diagnosis || prev.diagnosis),
            chiefComplaint: edited.has("chiefComplaint") ? prev.chiefComplaint : (prescription.chiefComplaint || prev.chiefComplaint),
            medicines: edited.has("medicines") ? prev.medicines : ((prescription.medicines && prescription.medicines.length) ? prescription.medicines : prev.medicines),
            labTests: edited.has("labTests") ? prev.labTests : ((prescription.labTests && prescription.labTests.length) ? prescription.labTests : prev.labTests),
            advice: edited.has("advice") ? prev.advice : (prescription.advice || prev.advice),
            followUpDays: edited.has("followUpDays") ? prev.followUpDays : (prescription.followUpDays !== undefined ? prescription.followUpDays : prev.followUpDays),
            clinicalSummary: edited.has("clinicalSummary") ? prev.clinicalSummary : (prescription.clinicalSummary || prev.clinicalSummary),
            vitals: edited.has("vitals") ? prev.vitals : mergeVitals(prev.vitals, prescription.vitals),
          }));
          setIsAiGenerated(true);
          setVisualizerStep("done");
          setTimeout(() => {
            setVisualizerStep(prev => prev === "done" ? "idle" : prev);
          }, 3000);
        }
      } else {
        setVisualizerStep("error");
        setVisualizerError("Live AI structuring failed.");
      }
    } catch (err) {
      console.error("[Live Parsing Error]:", err);
      setVisualizerStep("error");
      setVisualizerError("Failed to reach AI parsing gateway.");
    } finally {
      setIsParsingLive(false);
    }
  }, [patient, lastDx, language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not initialized.");
      return;
    }
    try {
      setDictationDuration(0);
      recognitionRef.current.start();
    } catch (err) {
      console.error("[SpeechRecognition Start Failed]:", err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const getLangLocale = useCallback((langCode: string): string => {
    switch (langCode) {
      case "es": return "es-ES";
      case "hi": return "hi-IN";
      case "fr": return "fr-FR";
      case "de": return "de-DE";
      case "ar": return "ar-SA";
      case "pt": return "pt-PT";
      case "en":
      default:
        return "en-US";
    }
  }, []);

  // Initialize SpeechRecognition on language change or mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const winObj = window as unknown as { SpeechRecognition?: new () => SpeechRecognition; webkitSpeechRecognition?: new () => SpeechRecognition };
    const SpeechRecognitionAPI = winObj.SpeechRecognition || winObj.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("[VoicePrescriptionFlow] Browser SpeechRecognition is not supported.");
      return;
    }

    const rec = new SpeechRecognitionAPI();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = getLangLocale(language);

    rec.onstart = () => {
      setIsListening(true);
      setVisualizerStep("recording");
      setVisualizerError(null);
      toast.success("Voice dictation active. Start speaking...");

      // Start initial silence timeout if auto-stop is active
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
      if (micModeRef.current === "auto-stop") {
        autoStopTimeoutRef.current = setTimeout(() => {
          rec.stop();
          toast.info("Microphone auto-paused due to inactivity.");
        }, micAutoStopDurationRef.current * 1000);
      }
    };

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const combined = (finalTranscript || interimTranscript).trim();
      if (combined) {
        setLiveTranscript(combined);
        setRawVoice(combined);

        // Reset the auto-stop timer
        if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
        if (micModeRef.current === "auto-stop") {
          autoStopTimeoutRef.current = setTimeout(() => {
            rec.stop();
            toast.info("Microphone auto-paused due to inactivity.");
          }, micAutoStopDurationRef.current * 1000);
        }

        // Debounce AI structured prescription parsing based on configured trigger delay
        if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);
        parseTimeoutRef.current = setTimeout(() => {
          if (combined !== parseSpeechRef.current) {
            triggerLiveParsing(combined);
          }
        }, aiPauseDurationRef.current * 1000);
      }
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      console.error("[SpeechRecognition Error]:", e.error, e.message);
      setVisualizerStep("error");
      setVisualizerError(e.message || e.error);
      if (e.error === "not-allowed") {
        toast.error("Microphone access denied. Please check site permissions.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setVisualizerStep(prev => prev === "recording" ? "idle" : prev);
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = null;
      }
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
        parseTimeoutRef.current = null;
      }
    };

    recognitionRef.current = rec;

    return () => {
      rec.abort();
      if (parseTimeoutRef.current) clearTimeout(parseTimeoutRef.current);
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    };
  }, [language, getLangLocale, triggerLiveParsing]);

  const loadPatientData = useCallback(async (pid: string, aptId?: string) => {
    
    const { data: p, error: pError } = await supabase
      .from("patients")
      .select("id, full_name, age, gender, allergies, email, phone")
      .eq("id", pid)
      .maybeSingle();

    if (pError) {
      throw new Error(`Patient detail lookup failed: ${pError.message}`);
    }

    if (!p) {
      throw new Error(`Patient with ID ${pid} not found.`);
    }

    if (activeRef.current) {
      setPatient(p as PatientCtx);
      setSendEmail(!!p.email);
      setSendWhatsApp(!!p.phone);
      // Set the appointment ID if it came from the picker
      if (aptId) setSelectedAppointmentId(aptId);
    }

    // Load patient vitals
    const { data: vList, error: vError } = await supabase
      .from("patient_vitals")
      .select("bp_systolic, bp_diastolic, weight_kg, temperature_f, pulse_rate, spo2, height_cm, bmi")
      .eq("patient_id", pid)
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (vError) {
      console.warn("[VoicePrescriptionFlow] Supabase query warn for patient vitals:", vError);
    }

    if (activeRef.current && vList && vList.length > 0) {
      const v = vList[0];
      setRx(prev => ({
        ...prev,
        vitals: {
          bpSystolic: v.bp_systolic ?? null,
          bpDiastolic: v.bp_diastolic ?? null,
          weightKg: v.weight_kg ? Number(v.weight_kg) : null,
          temperatureF: v.temperature_f ? Number(v.temperature_f) : null,
          pulseRate: v.pulse_rate ?? null,
          spo2: v.spo2 ?? null,
          heightCm: v.height_cm ? Number(v.height_cm) : null,
          bmi: v.bmi ? Number(v.bmi) : null,
        }
      }));
    }

    // Load previous prescription (full) — powers "Repeat last Rx" + the one-line summary.
    const { data: lastRx, error: rxError } = await supabase
      .from("prescriptions")
      .select("diagnosis, chief_complaint, medicines, lab_tests, advice, follow_up_days, clinical_summary, created_at")
      .eq("patient_id", pid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (rxError) {
      console.warn("[VoicePrescriptionFlow] Supabase query warn for last prescription:", rxError);
    }

    if (activeRef.current && lastRx?.diagnosis) {
      setLastDx(lastRx.diagnosis);
    }

    if (activeRef.current && lastRx) {
      const meds = Array.isArray(lastRx.medicines) ? (lastRx.medicines as unknown as Medicine[]) : [];
      setLastRxFull({
        diagnosis: lastRx.diagnosis ?? "",
        chiefComplaint: lastRx.chief_complaint ?? "",
        medicines: meds,
        labTests: (lastRx.lab_tests as string[] | null) ?? [],
        advice: lastRx.advice ?? "",
        followUpDays: lastRx.follow_up_days ?? null,
        clinicalSummary: lastRx.clinical_summary ?? "",
        createdAt: lastRx.created_at as string,
      });
    } else if (activeRef.current) {
      setLastRxFull(null);
    }
  }, [supabase]);

  const loadWaitingPatients = useCallback(async () => {
    
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user;

    if (authError) {
      throw new Error(`Authentication query failed: ${authError.message}`);
    }
    if (!user) {
      throw new Error("User session not found. Please log in again.");
    }

    const today = new Date().toISOString().split("T")[0];

    // Step 1: Fetch appointments (with only scalar columns, no joins)
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("id, patient_id")
      .eq("doctor_id", user.id)
      .eq("appointment_date", today)
      .in("status", ["waiting", "in_progress"]);

    if (appointmentsError) {
      throw new Error(`Appointments query failed: ${appointmentsError.message}`);
    }

    if (!appointments || appointments.length === 0) {
      if (activeRef.current) {
        setWaitingPatients([]);
        setView("picker");
      }
      return;
    }

    // Step 2: Fetch patient names separately to avoid RLS join issues
    const patientIds = appointments.map(a => a.patient_id);
    const { data: patients, error: patientsError } = await supabase
      .from("patients")
      .select("id, full_name")
      .in("id", patientIds);

    if (patientsError) {
      throw new Error(`Patients query failed: ${patientsError.message}`);
    }

    // Step 3: Build the waiting list
    const patientMap = new Map((patients ?? []).map(p => [p.id, p.full_name]));
    const list = appointments.map(a => ({
      id: a.patient_id,
      full_name: patientMap.get(a.patient_id) ?? "Patient",
      appointment_id: a.id,
    }));


    if (activeRef.current) {
      setWaitingPatients(list);
      setView("picker");
    }
  }, [supabase]);

  // Handle patient selection from the picker — entirely client-side, no URL navigation
  const handleSelectPatient = useCallback(async (pid: string, aptId?: string) => {
    setView("loading");
    setSelectedPatientId(pid);
    setSelectedAppointmentId(aptId);
    setErrorMessage(null);
    resetEditLocks();
    setRx(EMPTY_RX);
    setIsAiGenerated(false);

    try {
      await loadPatientData(pid, aptId);
      if (activeRef.current) {
        setView("patient");
      }
    } catch (err) {
      console.error("[VoicePrescriptionFlow] Failed to load selected patient:", err);
      if (activeRef.current) {
        setErrorMessage(err instanceof Error ? err.message : "Failed to load patient data.");
        setView("error");
      }
    }
  }, [loadPatientData, resetEditLocks]);

  // Initial load: either load patient directly if patientId provided, or show the picker
  useEffect(() => {
    activeRef.current = true;

    const load = async () => {
      setView("loading");
      setErrorMessage(null);

      try {
        if (initialPatientId) {
          await loadPatientData(initialPatientId, initialAppointmentId);
          if (activeRef.current) {
            setView("patient");
          }
        } else {
          await loadWaitingPatients();
        }
      } catch (err) {
        console.error("[VoicePrescriptionFlow] Runtime error during loading flow data:", err);
        if (activeRef.current) {
          setErrorMessage(err instanceof Error ? err.message : "An unexpected load error occurred.");
          setView("error");
        }
      }
    };

    load();

    return () => {
      activeRef.current = false;
    };
    // Only run on mount / when the initial props change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPatientId, initialAppointmentId]);

  const handleAiResult = (result: StructuredPrescription & { rawVoiceText: string }) => {
    resetEditLocks();
    setRx({
      diagnosis: result.diagnosis,
      chiefComplaint: result.chiefComplaint,
      medicines: result.medicines,
      labTests: result.labTests,
      advice: result.advice,
      followUpDays: result.followUpDays ?? null,
      clinicalSummary: result.clinicalSummary || "",
      vitals: mergeVitals(rx.vitals, result.vitals),
    });
    setRawVoice(result.rawVoiceText);
    setIsAiGenerated(true);
    toast.success("Prescription generated. Review and save.");
  };

  // One-tap reuse of the patient's previous prescription. Loads the full script
  // and locks every field so live dictation can't wipe the carried-forward Rx
  // (the doctor edits by hand, or just signs). Highest-ROI repeat-patient flow.
  const repeatLastPrescription = useCallback(() => {
    if (!lastRxFull) return;
    setRx(prev => ({
      diagnosis: lastRxFull.diagnosis,
      chiefComplaint: lastRxFull.chiefComplaint,
      medicines: lastRxFull.medicines.map(m => ({ ...m })),
      labTests: [...lastRxFull.labTests],
      advice: lastRxFull.advice,
      followUpDays: lastRxFull.followUpDays,
      clinicalSummary: lastRxFull.clinicalSummary,
      vitals: prev.vitals, // keep today's freshly-loaded vitals
    }));
    // Lock everything carried forward against AI overwrite.
    userEditedRef.current = new Set(FIELD_KEYS);
    setEditedFields([...FIELD_KEYS]);
    setIsAiGenerated(true);
    if (workflowMode === "dictation" && isListening) stopListening();
    toast.success("Repeated last prescription. Review, tweak durations, and sign.");
  }, [lastRxFull, workflowMode, isListening, stopListening]);

  const persistEmailIfNeeded = async () => {
    if (!patient || patient.email || !emailToAdd) return;
    await supabase.from("patients").update({ email: emailToAdd }).eq("id", patient.id);
    setPatient({ ...patient, email: emailToAdd });
  };

  const handleSave = async () => {
    if (!patient) return toast.error("No patient selected");
    if (!rx.diagnosis.trim()) return toast.error("Diagnosis is required");
    if (rx.medicines.length === 0) return toast.error("Add at least one medicine");

    setSaving(true);
    await persistEmailIfNeeded();

    const result = await saveAndShipPrescription({
      patientId: patient.id,
      appointmentId: selectedAppointmentId,
      prescription: rx,
      rawVoiceText: rawVoice || undefined,
      isAiGenerated,
      transcriptionLanguage: language,
      sendEmail,
      sendWhatsApp,
    });
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.emailQueued && result.whatsAppQueued) {
      toast.success("Prescription saved — emailing & WhatsApping to patient");
    } else if (result.emailQueued) {
      toast.success("Prescription saved — emailing to patient");
    } else if (result.whatsAppQueued) {
      toast.success("Prescription saved — sending on WhatsApp");
    } else {
      toast.success("Prescription saved successfully");
    }

    if (result.pdfUrl) {
      // Show the PDF inline (no popup, no surprise auto-print). The doctor
      // confirms visually, prints/downloads on demand, then proceeds.
      setPdfPreviewUrl(result.pdfUrl);
    } else {
      setTimeout(() => router.push("/doctor/prescriptions"), 800);
    }
  };

  if (view === "error") {
    return (
      <Card className="border-destructive bg-destructive/5">
        <CardContent className="space-y-4 p-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <h2 className="text-lg font-semibold text-destructive">Failed to load prescription flow</h2>
          <p className="text-sm text-muted-foreground max-w-md">{errorMessage}</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/doctor/dashboard")}>
              Back to dashboard
            </Button>
            <Button onClick={() => {
              setView("loading");
              setErrorMessage(null);
              // Re-run initial load
              if (initialPatientId) {
                loadPatientData(initialPatientId, initialAppointmentId).then(() => {
                  if (activeRef.current) setView("patient");
                }).catch(err => {
                  if (activeRef.current) {
                    setErrorMessage(err instanceof Error ? err.message : "Retry failed");
                    setView("error");
                  }
                });
              } else {
                loadWaitingPatients().catch(err => {
                  if (activeRef.current) {
                    setErrorMessage(err instanceof Error ? err.message : "Retry failed");
                    setView("error");
                  }
                });
              }
            }}>
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (view === "loading") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (view === "picker") {
    return (
      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="text-xl font-semibold">Pick a patient to prescribe for</h2>
          {waitingPatients.length === 0 && <p className="text-sm text-muted-foreground">No appointments today.</p>}
          <div className="grid gap-2 md:grid-cols-2">
            {waitingPatients.map((p) => (
              <Button
                key={p.appointment_id ?? p.id}
                variant="outline"
                onClick={() => handleSelectPatient(p.id, p.appointment_id)}
                className="justify-start"
              >
                <User className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">{p.full_name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!patient) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="space-y-4 p-6 flex flex-col items-center text-center">
          <AlertTriangle className="h-10 w-10 text-amber-600" />
          <h2 className="text-lg font-semibold text-amber-800">No patient details loaded</h2>
          <p className="text-sm text-muted-foreground max-w-md">No patient profile was retrieved. Please check parameters or selection.</p>
          <Button variant="outline" onClick={() => router.push("/doctor/dashboard")}>
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <Mic className="h-6 w-6 text-red-500 animate-pulse" /> Live voice prescription
          </h1>
          <p className="text-sm text-slate-500 mt-1">Dictate diagnosis, vitals, medicines, tests naturally. AI structures it in real time.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <Button
            size="sm"
            variant={workflowMode === "dictation" ? "default" : "ghost"}
            onClick={() => {
              setWorkflowMode("dictation");
              toast.info("Switching to Voice Dictation Mode. Browser Web Speech active.");
            }}
            className="rounded-lg text-xs"
          >
            <Mic className="mr-1.5 h-3.5 w-3.5" /> Dictation
          </Button>
          <Button
            size="sm"
            variant={workflowMode === "manual" ? "default" : "ghost"}
            onClick={() => {
              setWorkflowMode("manual");
              stopListening();
              toast.info("Switching to Manual Entry Mode. Microphone turned off.");
            }}
            className="rounded-lg text-xs"
          >
            <Keyboard className="mr-1.5 h-3.5 w-3.5" /> Manual typing
          </Button>
        </div>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden bg-gradient-to-r from-slate-50 to-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-lg">{patient.full_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Age {patient.age ?? "—"} · {patient.gender ?? "—"} · {patient.phone ?? "no phone"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {patient.allergies && patient.allergies.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs text-yellow-850 border border-yellow-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-650" />
                  Allergies: {patient.allergies.join(", ")}
                </div>
              )}
              {lastDx && (
                <div className="text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                  Last visit: {lastDx}
                </div>
              )}
              {lastRxFull && lastRxFull.medicines.length > 0 && (
                <Button
                  size="sm"
                  onClick={repeatLastPrescription}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm rounded-lg"
                  title={`Repeat: ${lastRxFull.medicines.map(m => m.name).filter(Boolean).join(", ")}`}
                >
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Repeat last Rx
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="bg-white border-slate-200 hover:bg-slate-50 shadow-sm rounded-lg"
              >
                <FileText className="mr-1.5 h-3.5 w-3.5 text-indigo-500" />
                View Medical History
              </Button>
            </div>
          </div>

          {/* Vitals Grid Dashboard */}
          <div>
            <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-wider mb-2.5">Recorded Patient Vitals</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              <div className="rounded-xl border border-slate-150 bg-white p-3 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Blood Pressure</span>
                <span className="text-sm font-semibold text-slate-700 mt-1">
                  {rx.vitals?.bpSystolic && rx.vitals?.bpDiastolic ? `${rx.vitals.bpSystolic}/${rx.vitals.bpDiastolic}` : "—"} <span className="text-[10px] font-normal text-slate-400">mmHg</span>
                </span>
              </div>
              <div className="rounded-xl border border-slate-150 bg-white p-3 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Temperature</span>
                <span className="text-sm font-semibold text-slate-700 mt-1">
                  {rx.vitals?.temperatureF ? `${rx.vitals.temperatureF}°F` : "—"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-150 bg-white p-3 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Pulse Rate</span>
                <span className="text-sm font-semibold text-slate-700 mt-1">
                  {rx.vitals?.pulseRate ? `${rx.vitals.pulseRate} bpm` : "—"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-150 bg-white p-3 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Oxygen (SpO₂)</span>
                <span className="text-sm font-semibold text-slate-700 mt-1">
                  {rx.vitals?.spo2 ? `${rx.vitals.spo2}%` : "—"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-150 bg-white p-3 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Weight</span>
                <span className="text-sm font-semibold text-slate-700 mt-1">
                  {rx.vitals?.weightKg ? `${rx.vitals.weightKg} kg` : "—"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-150 bg-white p-3 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Height</span>
                <span className="text-sm font-semibold text-slate-700 mt-1">
                  {rx.vitals?.heightCm ? `${rx.vitals.heightCm} cm` : "—"}
                </span>
              </div>
              <div className="rounded-xl border border-slate-150 bg-white p-3 shadow-xs flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">BMI</span>
                <span className="text-sm font-semibold text-slate-700 mt-1">
                  {rx.vitals?.bmi ? rx.vitals.bmi : "—"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-150 bg-slate-50/50 shadow-sm">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Globe className="h-4 w-4 text-indigo-500" />
            <span>Consultation Language</span>
          </div>
          <div className="w-56">
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {recognitionSupported && workflowMode === "dictation" ? (
        <Card className="border-slate-150 bg-white shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <ECGVisualizer
              step={visualizerStep}
              stream={visualizerStream}
              duration={dictationDuration}
              errorMsg={visualizerError}
            />

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex gap-2">
                <Button
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    "rounded-xl shadow-sm px-6 py-2 flex items-center gap-2",
                    isListening ? "bg-red-500 hover:bg-red-655 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  )}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4" /> Pause dictation
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" /> Start dictating
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                  className="rounded-xl px-4 py-2 flex items-center gap-2 border-slate-200 hover:bg-slate-50 text-slate-700"
                >
                  <Sliders className="h-4 w-4 text-slate-500" />
                  Settings
                </Button>
                {visualizerStep === "error" && (
                  <Button variant="ghost" onClick={() => {
                    setVisualizerStep("idle");
                    setVisualizerError(null);
                  }}>
                    Reset
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-450 max-w-sm">
                  {isListening 
                    ? "Speak complaints, diagnosis, vitals, medicines, advice. Pause to auto-update." 
                    : "Tap the button above to start dictating."}
                </p>
              </div>
            </div>

            {showSettings && (
              <div className="border-t border-slate-100 pt-5 space-y-4 text-left animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                    <Sliders className="h-4 w-4 text-indigo-500" /> Dictation Settings
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMicMode(DEFAULT_MIC_MODE);
                      setAiPauseDuration(DEFAULT_AI_PAUSE_SEC);
                      setMicAutoStopDuration(DEFAULT_MIC_STOP_SEC);
                      toast.success("Settings reset to defaults");
                    }}
                    className="text-xs h-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                  >
                    Reset to defaults
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600">Microphone Behavior</Label>
                    <Select
                      value={micMode}
                      onChange={(e) => setMicMode(e.target.value as "manual" | "auto-stop")}
                      className="text-xs"
                    >
                      <option value="auto-stop">Intelligent Auto-Stop</option>
                      <option value="manual">Continuous (Manual Stop)</option>
                    </Select>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Intelligent Auto-Stop pauses the mic automatically when you stop speaking.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-600 flex justify-between">
                      <span>AI Trigger Delay</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">{aiPauseDuration}s</span>
                    </Label>
                    <div className="flex items-center h-10">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={aiPauseDuration}
                        onChange={(e) => setAiPauseDuration(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      How long to wait after you pause speaking to parse with AI.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className={cn(
                      "text-xs font-semibold flex justify-between",
                      micMode === "auto-stop" ? "text-slate-600" : "text-slate-400"
                    )}>
                      <span>Mic Auto-Stop Delay</span>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">{micAutoStopDuration}s</span>
                    </Label>
                    <div className="flex items-center h-10">
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        disabled={micMode !== "auto-stop"}
                        value={micAutoStopDuration}
                        onChange={(e) => setMicAutoStopDuration(parseInt(e.target.value))}
                        className={cn(
                          "w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-indigo-600",
                          micMode === "auto-stop" ? "bg-slate-200" : "bg-slate-100 cursor-not-allowed"
                        )}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Seconds of silence before turning off the mic (Intelligent mode only).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Transcription log box */}
            {liveTranscript && (
              <div className="rounded-xl bg-slate-50 border border-slate-150 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-slate-450" /> Real-time Speech Transcription
                  </span>
                  {isParsingLive ? (
                    <span className="text-purple-650 flex items-center gap-1 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 animate-pulse">
                      <Sparkles className="h-3 w-3" /> AI parsing...
                    </span>
                  ) : (
                    <span className="text-emerald-650 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Syncing
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 italic font-mono leading-relaxed">
                  &ldquo;{liveTranscript}&rdquo;
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : !recognitionSupported && workflowMode === "dictation" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800 shadow-sm">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <span className="font-semibold block">Browser Dictation Unsupported</span>
              <span>Real-time voice dictation is unavailable in this browser. Falling back to high-fidelity audio recorder mode.</span>
            </div>
          </div>
          <VoiceRecorder
            language={language}
            patientContext={{
              age: patient.age,
              gender: patient.gender,
              allergies: patient.allergies,
              lastDiagnosis: lastDx,
            }}
            onPrescriptionGenerated={handleAiResult}
          />
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 bg-slate-50/30">
          <CardContent className="p-6 text-center text-sm text-slate-500 flex flex-col items-center justify-center gap-2">
            <Keyboard className="h-6 w-6 text-slate-400 animate-bounce" />
            <span className="font-medium">Manual entry mode active</span>
            <span className="text-xs text-slate-450 max-w-sm">Microphone is disabled. Tweak, edit, or append any section directly in the editor below.</span>
          </CardContent>
        </Card>
      )}

      {/* Structured preview building live on screen (Visible ONLY if AI has structured or in manual typing) */}
      {(workflowMode === "manual" || isAiGenerated) && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-850 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500 animate-spin" /> 
              Prescription details
            </h2>
            {isAiGenerated && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200">AI Structured</Badge>
            )}
          </div>
          
          <PrescriptionEditor
            value={rx}
            onChange={handleEditorChange}
            favorites={favorites}
            transcript={rawVoice}
            aiGenerated={isAiGenerated}
            editedFields={editedFields}
          />

          {!patient.email && (
            <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
              <CardContent className="flex items-end gap-3 p-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="addEmail">Patient email (optional, to send PDF)</Label>
                  <Input id="addEmail" type="email" value={emailToAdd} onChange={(e) => { const v = e.target.value; setEmailToAdd(v); if (v) setSendEmail(true); }} placeholder="patient@example.com" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="email-dispatch"
                  checked={sendEmail}
                  disabled={!patient.email && !emailToAdd}
                  onCheckedChange={setSendEmail}
                />
                <Label htmlFor="email-dispatch" className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
                  <Mail className="h-3.5 w-3.5 mr-1 text-indigo-500" /> Email PDF
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="whatsapp-dispatch"
                  checked={sendWhatsApp}
                  disabled={!patient.phone}
                  onCheckedChange={setSendWhatsApp}
                />
                <Label htmlFor="whatsapp-dispatch" className="text-xs font-semibold text-slate-600 flex items-center gap-1 cursor-pointer">
                  <Smartphone className="h-3.5 w-3.5 mr-1 text-emerald-500" /> WhatsApp
                </Label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                {saving ? (
                  <>Saving…</>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save & Dispatch
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* In-page PDF preview after sign-off (replaces popup + auto-print) */}
      <Dialog
        open={!!pdfPreviewUrl}
        onOpenChange={(open) => {
          if (!open) {
            setPdfPreviewUrl(null);
            router.push("/doctor/prescriptions");
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden p-0">
          <DialogHeader className="border-b border-slate-100 p-4">
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <FileText className="h-5 w-5 text-emerald-600" />
              Prescription saved
            </DialogTitle>
            <DialogDescription className="text-xs">
              Review the prescription below. Print or download it, or finish to move to your next patient.
            </DialogDescription>
          </DialogHeader>

          {pdfPreviewUrl && (
            <iframe
              src={pdfPreviewUrl}
              title="Prescription PDF"
              className="h-[60vh] w-full border-0 bg-slate-100"
            />
          )}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 p-4">
            <a href={pdfPreviewUrl ?? "#"} target="_blank" rel="noopener noreferrer" download>
              <Button variant="outline" size="sm">
                <FileText className="mr-1.5 h-4 w-4" /> Open / Print
              </Button>
            </a>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setPdfPreviewUrl(null);
                router.push("/doctor/prescriptions");
              }}
            >
              Done — next patient
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chronological history dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              Medical History: {patient.full_name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Chronological medical journey containing past prescriptions, clinic visits, recorded vitals, and follow-ups.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm text-muted-foreground">Loading medical records timeline…</p>
              </div>
            ) : (
              <PatientTimeline
                prescriptions={historyData.prescriptions}
                appointments={historyData.appointments}
                vitals={historyData.vitals}
                followUps={historyData.followUps}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}