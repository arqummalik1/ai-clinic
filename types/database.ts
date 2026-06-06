// Placeholder. Generate the real types after Supabase is provisioned:
//   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > types/database.ts
//
// Until then, we widen the Database to `any` so that supabase-js queries
// don't infer Row=never. The exported Tables/TablesInsert helpers retain the
// row shapes for use in the rest of the codebase.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ClinicsRow {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  timezone: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UsersRow {
  id: string;
  clinic_id: string | null;
  role: "super_admin" | "clinic_admin" | "doctor" | "receptionist";
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

interface UserPermissionsRow {
  id: string;
  user_id: string;
  clinic_id: string;
  can_view_earnings: boolean;
  can_view_all_patients: boolean;
  can_export_prescriptions: boolean;
  can_view_other_doctors: boolean;
  can_manage_follow_ups: boolean;
  created_at: string;
  updated_at: string;
}

interface DoctorProfilesRow {
  id: string;
  user_id: string;
  clinic_id: string;
  specialization: string | null;
  qualification: string | null;
  degree: string | null;
  registration_no: string | null;
  consultation_fee: number;
  signature_url: string | null;
  prescription_header: string | null;
  prescription_footer: string | null;
  created_at: string;
  updated_at: string;
}

interface PatientsRow {
  id: string;
  clinic_id: string;
  full_name: string;
  age: number | null;
  date_of_birth: string | null;
  gender: "male" | "female" | "other" | null;
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

interface PatientVitalsRow {
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

interface AppointmentsRow {
  id: string;
  clinic_id: string;
  patient_id: string;
  doctor_id: string;
  receptionist_id: string | null;
  status: "waiting" | "in_progress" | "completed" | "cancelled" | "no_show";
  appointment_date: string;
  appointment_time: string | null;
  token_number: number | null;
  consultation_fee: number | null;
  fee_paid: boolean | null;
  payment_method: "cash" | "card" | "upi" | "insurance" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PrescriptionsRow {
  id: string;
  clinic_id: string;
  appointment_id: string | null;
  patient_id: string;
  doctor_id: string;
  diagnosis: string | null;
  chief_complaint: string | null;
  medicines: Json;
  lab_tests: string[] | null;
  notes: string | null;
  advice: string | null;
  is_ai_generated: boolean;
  raw_voice_text: string | null;
  follow_up_days: number | null;
  follow_up_date: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

interface EarningsRow {
  id: string;
  clinic_id: string;
  appointment_id: string | null;
  doctor_id: string;
  amount: number;
  payment_method: string | null;
  earned_date: string;
  created_at: string;
}

interface FollowUpsRow {
  id: string;
  clinic_id: string;
  prescription_id: string | null;
  patient_id: string;
  doctor_id: string;
  follow_up_date: string;
  scheduled_send_at: string | null;
  reminder_sent_at: string | null;
  notified: boolean;
  notification_channel: "whatsapp" | "sms" | "email" | null;
  custom_message: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

interface NotificationsRow {
  id: string;
  clinic_id: string;
  recipient_type: "patient" | "doctor" | "staff" | null;
  recipient_id: string | null;
  channel: "whatsapp" | "sms" | "email" | "in_app" | null;
  type: string | null;
  subject: string | null;
  body: string | null;
  status: "pending" | "sent" | "failed";
  metadata: Json | null;
  sent_at: string | null;
  created_at: string;
}

// Use `any` for the runtime Database type so supabase-js queries don't infer never
// during the placeholder phase. Generated types from `supabase gen types` will replace this.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;

export type Tables<T extends keyof TableRowMap> = TableRowMap[T];
export type TablesInsert<T extends keyof TableRowMap> = Partial<TableRowMap[T]>;
export type TablesUpdate<T extends keyof TableRowMap> = Partial<TableRowMap[T]>;

interface TableRowMap {
  clinics: ClinicsRow;
  users: UsersRow;
  user_permissions: UserPermissionsRow;
  doctor_profiles: DoctorProfilesRow;
  patients: PatientsRow;
  patient_vitals: PatientVitalsRow;
  appointments: AppointmentsRow;
  prescriptions: PrescriptionsRow;
  earnings: EarningsRow;
  follow_ups: FollowUpsRow;
  notifications: NotificationsRow;
}
