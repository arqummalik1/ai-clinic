import { getBrowserApiClient } from "@/lib/infrastructure/api/client";
import { PatientInput, VitalsInput, Patient, PatientVitals } from "@/lib/domain/models/patient";
import { ERROR_MESSAGES } from "@/lib/constants";

export class PatientService {
  private client = getBrowserApiClient();

  async getClinicIdAndUser(): Promise<{ clinicId: string; userId: string }> {
    const { data: { user }, error: authError } = await this.client.auth.getUser();
    if (authError || !user) {
      throw new Error(ERROR_MESSAGES.NOT_AUTHENTICATED);
    }

    const { data: userProfile, error: profileError } = await this.client
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile?.clinic_id) {
      throw new Error(ERROR_MESSAGES.NO_CLINIC_ASSIGNED);
    }

    return { clinicId: userProfile.clinic_id, userId: user.id };
  }

  async fetchPatients(search?: string): Promise<Patient[]> {
    let query = this.client
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (search && search.trim() !== "") {
      const sanitized = search.trim();
      query = query.or(`full_name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as Patient[]) ?? [];
  }

  async createPatient(patient: PatientInput): Promise<Patient> {
    const { clinicId, userId } = await this.getClinicIdAndUser();

    const { data, error } = await this.client
      .from("patients")
      .insert({
        ...patient,
        clinic_id: clinicId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error(ERROR_MESSAGES.CREATE_PATIENT_FAILED);
    return data as Patient;
  }

  async createVitals(patientId: string, clinicId: string, vitals: VitalsInput): Promise<PatientVitals> {
    const { data: { user } } = await this.client.auth.getUser();
    const userId = user?.id ?? null;

    const { data, error } = await this.client
      .from("patient_vitals")
      .insert({
        patient_id: patientId,
        clinic_id: clinicId,
        bp_systolic: vitals.bp_systolic,
        bp_diastolic: vitals.bp_diastolic,
        weight_kg: vitals.weight_kg,
        temperature_f: vitals.temperature_f,
        pulse_rate: vitals.pulse_rate,
        spo2: vitals.spo2,
        height_cm: vitals.height_cm,
        bmi: vitals.bmi,
        recorded_by: userId,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to save patient vitals");
    return data as PatientVitals;
  }

  // Statistics queries for dashboards
  async fetchReceptionStats(clinicId: string, today: string): Promise<{ todayAppointments: number; patientCount: number }> {
    const [{ count: todayApts }, { count: patientCount }] = await Promise.all([
      this.client
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId)
        .eq("appointment_date", today),
      this.client
        .from("patients")
        .select("id", { count: "exact", head: true })
        .eq("clinic_id", clinicId),
    ]);

    return {
      todayAppointments: todayApts ?? 0,
      patientCount: patientCount ?? 0,
    };
  }

  async fetchDoctorStats(doctorId: string, today: string): Promise<{ todayAppointments: number; totalPrescriptions: number }> {
    const [{ count: todayApts }, { count: totalPrescriptions }] = await Promise.all([
      this.client
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId)
        .eq("appointment_date", today),
      this.client
        .from("prescriptions")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", doctorId),
    ]);

    return {
      todayAppointments: todayApts ?? 0,
      totalPrescriptions: totalPrescriptions ?? 0,
    };
  }
}
