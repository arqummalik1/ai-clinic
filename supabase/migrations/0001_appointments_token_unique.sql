-- =============================================
-- Migration 0001 — Unique token per (clinic, date)
-- =============================================
-- The appointment-creation server action (`app/actions/appointments.ts`)
-- allocates a token by reading MAX(token_number)+1 and retries on a unique
-- violation (Postgres error 23505). That retry logic only works if a unique
-- constraint actually exists — otherwise concurrent receptionists can mint
-- duplicate tokens for the same clinic/day.
--
-- This index enforces token uniqueness per clinic per day. Cancelled/no-show
-- rows still occupy their token (intentional: tokens are a physical queue
-- position, not reused once issued).
--
-- NOTE: if existing data already contains duplicate (clinic_id,
-- appointment_date, token_number) tuples, de-duplicate them before running
-- this, otherwise the index creation will fail.
-- =============================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_appointments_clinic_date_token
  ON public.appointments (clinic_id, appointment_date, token_number)
  WHERE token_number IS NOT NULL;
