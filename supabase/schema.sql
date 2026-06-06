-- =============================================
-- MediSync — Full database schema
-- Paste this entire file into Supabase SQL Editor once.
-- Source: PRD §§ 4.1 - 4.3, plus Phase 12b additions for follow-up reminders.
-- =============================================

-- 4.1 EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 4.2 CORE TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS public.clinics (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  address       TEXT,
  phone         TEXT,
  email         TEXT,
  logo_url      TEXT,
  timezone      TEXT DEFAULT 'Asia/Kolkata',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id     UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('super_admin','clinic_admin','doctor','receptionist')),
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  avatar_url    TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clinic_id ON public.users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

CREATE TABLE IF NOT EXISTS public.user_permissions (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  clinic_id                   UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  can_view_earnings           BOOLEAN DEFAULT TRUE,
  can_view_all_patients       BOOLEAN DEFAULT FALSE,
  can_export_prescriptions    BOOLEAN DEFAULT TRUE,
  can_view_other_doctors      BOOLEAN DEFAULT FALSE,
  can_manage_follow_ups       BOOLEAN DEFAULT TRUE,
  created_at                  TIMESTAMPTZ DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =============================================
-- HELPER FUNCTIONS (must be after users & user_permissions tables)
-- =============================================
CREATE OR REPLACE FUNCTION get_user_clinic_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT clinic_id FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION user_has_permission(perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  EXECUTE format('SELECT %I FROM public.user_permissions WHERE user_id = $1', perm)
    INTO result
    USING auth.uid();
  RETURN COALESCE(result, FALSE);
END;
$$;

CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES public.users(id) ON DELETE CASCADE,
  clinic_id           UUID REFERENCES public.clinics(id) ON DELETE CASCADE,
  specialization      TEXT,
  qualification       TEXT,
  degree              TEXT,
  registration_no     TEXT,
  consultation_fee    DECIMAL(10,2) DEFAULT 0,
  signature_url       TEXT,
  prescription_header TEXT,
  prescription_footer TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.patients (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  age             INTEGER,
  date_of_birth   DATE,
  gender          TEXT CHECK (gender IN ('male','female','other')),
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  blood_group     TEXT,
  allergies       TEXT[],
  notes           TEXT,
  created_by      UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_clinic_id ON public.patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON public.patients(phone);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients USING GIN(to_tsvector('english', full_name));

CREATE TABLE IF NOT EXISTS public.patient_vitals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id      UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id       UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id  UUID,
  bp_systolic     INTEGER,
  bp_diastolic    INTEGER,
  weight_kg       DECIMAL(5,2),
  temperature_f   DECIMAL(4,1),
  pulse_rate      INTEGER,
  spo2            INTEGER,
  height_cm       DECIMAL(5,2),
  bmi             DECIMAL(4,2),
  recorded_by     UUID REFERENCES public.users(id),
  recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id        UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id        UUID NOT NULL REFERENCES public.users(id),
  receptionist_id  UUID REFERENCES public.users(id),
  status           TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','in_progress','completed','cancelled','no_show')),
  appointment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  appointment_time TIME,
  token_number     INTEGER,
  consultation_fee DECIMAL(10,2) DEFAULT 0,
  fee_paid         BOOLEAN DEFAULT FALSE,
  payment_method   TEXT CHECK (payment_method IN ('cash','card','upi','insurance')),
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_vitals_appointment') THEN
    ALTER TABLE public.patient_vitals
      ADD CONSTRAINT fk_vitals_appointment
      FOREIGN KEY (appointment_id) REFERENCES public.appointments(id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON public.appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);

-- Unique token per (clinic, date) — backs the retry-on-conflict logic in
-- app/actions/appointments.ts so concurrent inserts can't mint duplicate tokens.
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_clinic_date_token
  ON public.appointments (clinic_id, appointment_date, token_number)
  WHERE token_number IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES public.appointments(id),
  patient_id      UUID NOT NULL REFERENCES public.patients(id),
  doctor_id       UUID NOT NULL REFERENCES public.users(id),
  diagnosis       TEXT,
  chief_complaint TEXT,
  medicines       JSONB DEFAULT '[]',
  lab_tests       TEXT[],
  notes           TEXT,
  advice          TEXT,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  raw_voice_text  TEXT,
  clinical_summary TEXT,
  transcription_language TEXT DEFAULT 'en',
  follow_up_days  INTEGER,
  follow_up_date  DATE,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_clinic_id ON public.prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);

CREATE TABLE IF NOT EXISTS public.earnings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES public.appointments(id),
  doctor_id       UUID NOT NULL REFERENCES public.users(id),
  amount          DECIMAL(10,2) NOT NULL,
  payment_method  TEXT,
  earned_date     DATE DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_earnings_clinic_id ON public.earnings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_earnings_doctor_id ON public.earnings(doctor_id);
CREATE INDEX IF NOT EXISTS idx_earnings_date ON public.earnings(earned_date);

-- Phase 12b additions: scheduled_send_at + reminder_sent_at
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id            UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  prescription_id      UUID REFERENCES public.prescriptions(id),
  patient_id           UUID NOT NULL REFERENCES public.patients(id),
  doctor_id            UUID NOT NULL REFERENCES public.users(id),
  follow_up_date       DATE NOT NULL,
  scheduled_send_at    TIMESTAMPTZ,
  reminder_sent_at     TIMESTAMPTZ,
  notified             BOOLEAN DEFAULT FALSE,
  notification_channel TEXT CHECK (notification_channel IN ('whatsapp','sms','email')),
  custom_message       TEXT,
  notes                TEXT,
  created_by           UUID REFERENCES public.users(id),
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_clinic_id ON public.follow_ups(clinic_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_doctor_id ON public.follow_ups(doctor_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON public.follow_ups(follow_up_date) WHERE notified = FALSE;
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled ON public.follow_ups(scheduled_send_at) WHERE notified = FALSE;

CREATE TABLE IF NOT EXISTS public.notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id       UUID NOT NULL REFERENCES public.clinics(id),
  recipient_type  TEXT CHECK (recipient_type IN ('patient','doctor','staff')),
  recipient_id    UUID,
  channel         TEXT CHECK (channel IN ('whatsapp','sms','email','in_app')),
  type            TEXT,
  subject         TEXT,
  body            TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
  metadata        JSONB DEFAULT '{}',
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_clinic_id ON public.notifications(clinic_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);

-- =============================================
-- 4.3 ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.clinics            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vitals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.earnings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;

-- CLINICS: super_admin sees all; everyone else sees only their own
DROP POLICY IF EXISTS "clinics_access" ON public.clinics;
CREATE POLICY "clinics_access" ON public.clinics
  FOR ALL TO authenticated
  USING (
    get_user_role() = 'super_admin'
    OR id = get_user_clinic_id()
  );

-- USERS: same clinic only (super_admin sees all)
DROP POLICY IF EXISTS "users_own_clinic_only" ON public.users;
CREATE POLICY "users_own_clinic_only" ON public.users
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    OR get_user_role() = 'super_admin'
  );

-- USER_PERMISSIONS: same clinic
DROP POLICY IF EXISTS "permissions_own_clinic_only" ON public.user_permissions;
CREATE POLICY "permissions_own_clinic_only" ON public.user_permissions
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    OR get_user_role() = 'super_admin'
  );

-- DOCTOR_PROFILES: same clinic
DROP POLICY IF EXISTS "doctor_profiles_own_clinic_only" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_own_clinic_only" ON public.doctor_profiles
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    OR get_user_role() = 'super_admin'
  );

-- PATIENTS: doctor sees only assigned patients unless permission grants all
DROP POLICY IF EXISTS "doctors_see_assigned_patients" ON public.patients;
CREATE POLICY "doctors_see_assigned_patients" ON public.patients
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    AND (
      get_user_role() IN ('clinic_admin', 'receptionist', 'super_admin')
      OR (
        get_user_role() = 'doctor' AND (
          user_has_permission('can_view_all_patients')
          OR id IN (SELECT patient_id FROM public.appointments WHERE doctor_id = auth.uid())
        )
      )
    )
  );

-- PATIENT_VITALS: same clinic
DROP POLICY IF EXISTS "vitals_clinic_isolation" ON public.patient_vitals;
CREATE POLICY "vitals_clinic_isolation" ON public.patient_vitals
  FOR ALL TO authenticated
  USING (clinic_id = get_user_clinic_id());

-- APPOINTMENTS: doctors see only their own
DROP POLICY IF EXISTS "appointments_clinic_isolation" ON public.appointments;
CREATE POLICY "appointments_clinic_isolation" ON public.appointments
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    AND (
      get_user_role() IN ('clinic_admin','receptionist','super_admin')
      OR (get_user_role() = 'doctor' AND doctor_id = auth.uid())
    )
  );

-- PRESCRIPTIONS: doctor sees own; admin/reception see all in clinic
DROP POLICY IF EXISTS "prescriptions_access" ON public.prescriptions;
CREATE POLICY "prescriptions_access" ON public.prescriptions
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    AND (
      get_user_role() IN ('clinic_admin','receptionist','super_admin')
      OR (get_user_role() = 'doctor' AND doctor_id = auth.uid())
    )
  );

-- EARNINGS: respects can_view_earnings permission
DROP POLICY IF EXISTS "earnings_clinic_isolation" ON public.earnings;
CREATE POLICY "earnings_clinic_isolation" ON public.earnings
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    AND (
      get_user_role() IN ('clinic_admin','super_admin')
      OR (
        get_user_role() = 'doctor'
        AND doctor_id = auth.uid()
        AND user_has_permission('can_view_earnings')
      )
    )
  );

-- FOLLOW_UPS: doctor sees own (or all if can_view_all_patients); reception/admin see all in clinic
DROP POLICY IF EXISTS "follow_ups_access" ON public.follow_ups;
CREATE POLICY "follow_ups_access" ON public.follow_ups
  FOR ALL TO authenticated
  USING (
    clinic_id = get_user_clinic_id()
    AND (
      get_user_role() IN ('clinic_admin','receptionist','super_admin')
      OR (
        get_user_role() = 'doctor' AND (
          doctor_id = auth.uid() OR user_has_permission('can_view_all_patients')
        )
      )
    )
  );

-- NOTIFICATIONS: same clinic
DROP POLICY IF EXISTS "notifications_clinic_isolation" ON public.notifications;
CREATE POLICY "notifications_clinic_isolation" ON public.notifications
  FOR ALL TO authenticated
  USING (clinic_id = get_user_clinic_id() OR get_user_role() = 'super_admin');

-- =============================================
-- DEFAULTS: every new user automatically gets a permissions row
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_permissions()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'doctor' THEN
    INSERT INTO public.user_permissions (user_id, clinic_id)
    VALUES (NEW.id, NEW.clinic_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_permissions ON public.users;
CREATE TRIGGER on_user_created_permissions
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_permissions();

-- =============================================
-- TOKEN NUMBER: atomic per (clinic, date)
-- =============================================
CREATE OR REPLACE FUNCTION public.next_token_number(p_clinic_id UUID, p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Use pg_advisory_xact_lock to avoid race conditions while reading MAX.
  -- We encode the clinic+date into an 8-byte bigint for the advisory lock.
  PERFORM pg_advisory_xact_lock(
    hashtext(p_clinic_id::text || p_date::text)
  );
  SELECT COALESCE(MAX(token_number), 0) + 1
    INTO next_num
    FROM public.appointments
    WHERE clinic_id = p_clinic_id AND appointment_date = p_date;
  RETURN next_num;
END;
$$;

-- =============================================
-- STORAGE: prescriptions bucket policies
-- Run AFTER creating the bucket "prescriptions" (private) in Supabase dashboard.
-- =============================================
-- Policy: clinic users can read/write only their clinic's PDFs.
-- Storage paths follow pattern: {clinic_id}/{prescription_id}.pdf
-- =============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'prescriptions') THEN
    DROP POLICY IF EXISTS "prescriptions_clinic_read" ON storage.objects;
    CREATE POLICY "prescriptions_clinic_read" ON storage.objects
      FOR SELECT TO authenticated
      USING (
        bucket_id = 'prescriptions'
        AND (split_part(name, '/', 1))::uuid = get_user_clinic_id()
      );

    DROP POLICY IF EXISTS "prescriptions_clinic_write" ON storage.objects;
    CREATE POLICY "prescriptions_clinic_write" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'prescriptions'
        AND (split_part(name, '/', 1))::uuid = get_user_clinic_id()
      );
  END IF;
END $$;
