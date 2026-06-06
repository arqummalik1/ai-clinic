import type { PrescriptionInput, StructuredPrescription } from "../index";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateWithOpenAI(_input: PrescriptionInput): Promise<StructuredPrescription> {
  throw new Error("OpenAI provider not implemented. Implement here to swap from Groq.");
}
