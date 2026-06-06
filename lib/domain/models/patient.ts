import { GenderType } from "@/lib/constants";

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  age: number | null;
  date_of_birth: string | null;
  gender: GenderType | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  blood_group: string | null;
  allergies: string[] | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientVitals {
  id: string;
  patient_id: string;
  clinic_id: string;
  appointment_id: string | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  weight_kg: number | null;
  temperature_f: number | null;
  pulse_rate: number | null;
  spo2: number | null;
  height_cm: number | null;
  bmi: number | null;
  recorded_by: string | null;
  recorded_at: string;
}

export type PatientInput = Omit<Patient, "id" | "clinic_id" | "created_at" | "updated_at">;
export type VitalsInput = Omit<PatientVitals, "id" | "patient_id" | "clinic_id" | "recorded_at">;

export function validatePatientInput(input: Partial<PatientInput>): string | null {
  if (!input.full_name || !input.full_name.trim()) {
    return "Name is required";
  }
  if (!input.phone || !input.phone.trim()) {
    return "Phone number is required";
  }
  // Validate standard phone formats (e.g. at least 10 digits)
  const phoneDigits = input.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    return "Phone number must be at least 10 digits";
  }
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return "Invalid email format";
  }
  if (input.age !== undefined && input.age !== null) {
    if (isNaN(input.age) || input.age < 0 || input.age > 150) {
      return "Age must be a valid number between 0 and 150";
    }
  }
  return null;
}

export function validateVitalsInput(input: Partial<VitalsInput>): string | null {
  if (input.bp_systolic !== undefined && input.bp_systolic !== null) {
    if (isNaN(input.bp_systolic) || input.bp_systolic <= 0) {
      return "BP Systolic must be a positive number";
    }
  }
  if (input.bp_diastolic !== undefined && input.bp_diastolic !== null) {
    if (isNaN(input.bp_diastolic) || input.bp_diastolic <= 0) {
      return "BP Diastolic must be a positive number";
    }
  }
  if (input.weight_kg !== undefined && input.weight_kg !== null) {
    if (isNaN(input.weight_kg) || input.weight_kg <= 0) {
      return "Weight must be a positive number";
    }
  }
  if (input.temperature_f !== undefined && input.temperature_f !== null) {
    if (isNaN(input.temperature_f) || input.temperature_f < 50 || input.temperature_f > 120) {
      return "Temperature must be a valid Fahrenheit value between 50 and 120";
    }
  }
  if (input.pulse_rate !== undefined && input.pulse_rate !== null) {
    if (isNaN(input.pulse_rate) || input.pulse_rate <= 0) {
      return "Pulse rate must be a positive number";
    }
  }
  if (input.spo2 !== undefined && input.spo2 !== null) {
    if (isNaN(input.spo2) || input.spo2 < 0 || input.spo2 > 100) {
      return "SpO2 must be a percentage between 0 and 100";
    }
  }
  if (input.height_cm !== undefined && input.height_cm !== null) {
    if (isNaN(input.height_cm) || input.height_cm <= 0 || input.height_cm > 300) {
      return "Height must be a positive number between 0 and 300 cm";
    }
  }
  if (input.bmi !== undefined && input.bmi !== null) {
    if (isNaN(input.bmi) || input.bmi <= 0 || input.bmi > 100) {
      return "BMI must be a positive number between 0 and 100";
    }
  }
  return null;
}
