import type { PrescriptionInput } from "../index";

export function buildPrescriptionPrompt(input: PrescriptionInput): string {
  return `You are an AI medical assistant helping a doctor create a structured prescription.
The doctor has spoken the following during a live consultation:

"${input.transcription}"

Patient context (use this to validate dosages and avoid contraindications, but do NOT invent details not implied by the doctor):
- Age: ${input.patientAge ?? "Unknown"}
- Gender: ${input.patientGender ?? "Unknown"}
- Known allergies: ${input.allergies?.length ? input.allergies.join(", ") : "None recorded"}
- Last visit diagnosis: ${input.lastDiagnosis ?? "None"}
- Existing conditions: ${input.existingConditions?.join(", ") ?? "None"}

Language requested for Clinical Summary: ${input.language || "English"}

Extract and return a JSON object with this exact shape:
{
  "diagnosis": "string",
  "chiefComplaint": "string",
  "medicines": [
    {
      "name": "string",
      "dosage": "string (e.g. 500mg)",
      "frequency": "string (e.g. 3 times a day)",
      "duration": "string (e.g. 5 days)",
      "instructions": "string (e.g. after meals)"
    }
  ],
  "labTests": ["string"],
  "advice": "string",
  "followUpDays": number or null,
  "clinicalSummary": "string",
  "vitals": {
    "bpSystolic": number or null,
    "bpDiastolic": number or null,
    "weightKg": number or null,
    "temperatureF": number or null,
    "pulseRate": number or null,
    "spo2": number or null,
    "heightCm": number or null,
    "bmi": number or null
  }
}

Rules:
- Parse compound spoken statements and list multiple medicines individually (e.g., "Add X. Add Y. Also give Z." should yield 3 separate objects in the medicines array).
- Only include medicines actually mentioned by the doctor.
- If the doctor doesn't mention dosage explicitly, write "As directed".
- followUpDays: extract if doctor says "come back in X days", "follow up in X", "review after X" — else null.
- If a mentioned medicine could conflict with a recorded allergy, still include it but append " — verify allergy" to instructions.
- clinicalSummary: Generate a concise clinical summary (1-3 sentences) summarizing patient complaints, observations, diagnosis, and treatment decision. The summary MUST be generated in the requested language: ${input.language || "English"}.
- vitals: Extract mentioned physical vitals as numbers (e.g., "BP 120 over 80" -> bpSystolic: 120, bpDiastolic: 80; "temp 101" -> temperatureF: 101; "weight 65 kg" -> weightKg: 65; "pulse 72" -> pulseRate: 72; "oxygen 97%" -> spo2: 97; "height 170 cm" -> heightCm: 170; "BMI is 22" -> bmi: 22). Set unmentioned fields to null.
- Return ONLY valid JSON, no markdown fences, no commentary`;
}
