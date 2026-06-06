export type AIProvider = "groq" | "openai" | "anthropic";
export interface Vitals {
  bpSystolic?: number | null;
  bpDiastolic?: number | null;
  weightKg?: number | null;
  temperatureF?: number | null;
  pulseRate?: number | null;
  spo2?: number | null;
  heightCm?: number | null;
  bmi?: number | null;
}

export interface PrescriptionInput {
  transcription: string;
  patientAge?: number | null;
  patientGender?: string | null;
  allergies?: string[] | null;
  lastDiagnosis?: string | null;
  existingConditions?: string[];
  language?: string;
}

export interface Medicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface StructuredPrescription {
  diagnosis: string;
  chiefComplaint: string;
  medicines: Medicine[];
  labTests: string[];
  advice: string;
  followUpDays?: number | null;
  clinicalSummary: string;
  vitals?: Vitals;
}

export async function generatePrescription(
  input: PrescriptionInput,
  provider: AIProvider = "groq",
): Promise<StructuredPrescription> {
  switch (provider) {
    case "groq": {
      const { generateWithGroq } = await import("./providers/groq");
      return generateWithGroq(input);
    }
    case "openai": {
      const { generateWithOpenAI } = await import("./providers/openai");
      return generateWithOpenAI(input);
    }
    case "anthropic": {
      const { generateWithAnthropic } = await import("./providers/anthropic");
      return generateWithAnthropic(input);
    }
  }
}
