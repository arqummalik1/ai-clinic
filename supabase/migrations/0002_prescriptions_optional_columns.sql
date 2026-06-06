-- =============================================
-- Migration 0002 — add columns the app writes that older databases may lack.
-- Safe to run multiple times (IF NOT EXISTS). Run once in the Supabase SQL editor.
-- Fixes: "Could not find the 'clinical_summary' column of 'prescriptions'".
-- =============================================

-- prescriptions
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS chief_complaint        TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS advice                 TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS notes                  TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS clinical_summary       TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS raw_voice_text         TEXT;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS transcription_language TEXT DEFAULT 'en';
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS is_ai_generated        BOOLEAN DEFAULT FALSE;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS follow_up_days         INTEGER;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS follow_up_date         DATE;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS pdf_url                TEXT;

-- patient_vitals (height/BMI captured from the consult)
ALTER TABLE public.patient_vitals ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2);
ALTER TABLE public.patient_vitals ADD COLUMN IF NOT EXISTS bmi       DECIMAL(4,2);

-- doctor_profiles branding/details used by the prescription header
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS degree              TEXT;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS signature_url       TEXT;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS prescription_header TEXT;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS prescription_footer TEXT;

-- clinics logo used by the prescription header
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Ask PostgREST to refresh its schema cache so the new columns are visible.
NOTIFY pgrst, 'reload schema';
