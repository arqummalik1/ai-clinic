import { useState, useCallback, useRef } from "react";
import { PatientRepository } from "@/lib/repositories/patientRepository";
import { 
  Patient, 
  PatientInput, 
  VitalsInput, 
  validatePatientInput, 
  validateVitalsInput 
} from "@/lib/domain/models/patient";
import { handleException } from "@/lib/infrastructure/errors/handler";

export function usePatientViewModel(repository?: PatientRepository) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stable repository reference to prevent useCallback dependency churn
  const repositoryRef = useRef(repository ?? new PatientRepository());
  const repo = repositoryRef.current;

  const fetchPatientsList = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await repo.getAll(search);
      setPatients(data);
      setError(null);
    } catch (err: unknown) {
      const appErr = handleException(err);
      setError(appErr.message);
    } finally {
      setLoading(false);
    }
  }, [repo]);

  const registerPatient = useCallback(async (
    patientInput: PatientInput,
    vitalsInput?: VitalsInput
  ): Promise<{ success: boolean; data: Patient | null; error: string | null }> => {
    setLoading(true);
    setError(null);

    // Validation
    const validationError = validatePatientInput(patientInput);
    if (validationError) {
      setLoading(false);
      setError(validationError);
      return { success: false, data: null, error: validationError };
    }

    if (vitalsInput) {
      const vitalsError = validateVitalsInput(vitalsInput);
      if (vitalsError) {
        setLoading(false);
        setError(vitalsError);
        return { success: false, data: null, error: vitalsError };
      }
    }

    try {
      // 1. Create Patient
      const newPatient = await repo.create(patientInput);

      // 2. Save vitals if provided and at least one is non-empty
      if (vitalsInput) {
        const hasVitals = Object.values(vitalsInput).some((v) => v !== "" && v !== null && v !== undefined);
        if (hasVitals) {
          await repo.saveVitals(newPatient.id, newPatient.clinic_id, vitalsInput);
        }
      }

      setPatients((prev) => [newPatient, ...prev]);
      return { success: true, data: newPatient, error: null };
    } catch (err: unknown) {
      const appErr = handleException(err);
      setError(appErr.message);
      return { success: false, data: null, error: appErr.message };
    } finally {
      setLoading(false);
    }
  }, [repo]);

  return {
    patients,
    loading,
    error,
    fetchPatientsList,
    registerPatient,
  };
}