# MediSync

Multi-tenant, multi-clinic, multi-doctor AI medical SaaS. Doctors **speak** during a consult and an AI pipeline (Groq Whisper + LLaMA-3.3) turns the voice note into a structured prescription, generates a branded PDF, emails it to the patient, opens the print dialog, and books the follow-up — all in one click.

## Stack

- Next.js 15 App Router · React 19 · TypeScript · Tailwind v4
- Supabase (Postgres + Auth + Storage + Realtime + RLS)
- Groq SDK (`whisper-large-v3` + `llama-3.3-70b-versatile`)
- Twilio (WhatsApp + SMS) · Resend (Email)
- jsPDF · Recharts · sonner

## One-time setup

### 1. Environment

Copy `.env.local.example` → `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
TWILIO_SMS_FROM=
RESEND_API_KEY=
RESEND_FROM=onboarding@yourdomain.com
CRON_SECRET=                   # any random string; used to authorize follow-up cron
```

### 2. Database

In the Supabase SQL Editor, paste **`supabase/schema.sql`** and run it. This creates 11 tables, helper functions, RLS policies, the `next_token_number` RPC, and storage policies.

Then in Supabase Storage, create a private bucket named **`prescriptions`** (the schema also adds the policies for it).

Generate types:

```bash
npx supabase gen types typescript --project-id <project-ref> > types/database.ts
```

### 3. Bootstrap super admin

In the Supabase Auth dashboard, create one user manually. Then in the SQL Editor:

```sql
insert into public.users (id, clinic_id, role, full_name, email)
values ('<that-auth-uid>', null, 'super_admin', 'Root Admin', 'you@example.com');
```

### 4. Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 and log in as the super admin. Create the first clinic + clinic admin from `/super-admin/clinics`.

## Smoke test (end-to-end)

1. **Super admin** → create clinic + clinic admin.
2. **Clinic admin** → add 1 doctor + 1 receptionist; set permissions.
3. **Receptionist** → register a patient, create today's appointment (token #1, mark fee paid).
4. **Doctor** → see realtime queue, click **Call in** then **Voice prescribe** on the patient.
5. Speak: *"Patient has fever and headache. Give paracetamol 500mg three times a day for 5 days. Lab: CBC. Follow up in 7 days."*
6. AI transcribes and structures the prescription. Edit if needed.
7. Click **Save, Email & Print** → prescription saved, PDF uploaded to Storage, email sent to patient with PDF attached, print dialog opens.
8. **Doctor** & **Receptionist** → both see the auto-created follow-up under `/doctor/follow-ups` and `/reception/follow-ups`.
9. **Receptionist** → click **Send now** on the follow-up → patient gets a reminder; row flips to `Sent`.

## Cross-clinic RLS check

Log in as a doctor whose `clinic_id` differs from the patient — the patient list, queue, and prescriptions should be empty. RLS is enforced at the database level.

## Follow-up reminder cron

Wire any cron (Vercel Cron, Render, GitHub Actions, etc.) to hit:

```
POST /api/follow-ups/dispatch
Header: x-cron-secret: <CRON_SECRET>
```

Recommended cadence: every 15 minutes. The endpoint finds rows with `scheduled_send_at <= now()` and `notified = false`, sends via the chosen channel (email → WhatsApp → SMS priority), and logs to `notifications`.

For manual single sends, the FollowUpManager UI POSTs `/api/notifications/send` and updates `follow_ups.notified` directly.

## Voice prescription pipeline

```
Mic → Whisper (transcribe) → LLaMA-3.3 JSON mode (structure) → editable preview
   → on save: insert prescription, generate PDF (jsPDF), upload to Storage,
              email PDF (Resend), open print dialog, create follow_up row,
              mark appointment completed, insert earnings.
```

Failure modes are handled inline:

- Mic permission denied → friendly retry.
- No speech detected → "Try again".
- LLM returns invalid JSON → manual prescription editor still usable; raw transcription preserved.
- Patient has no email on file → inline "Add email" input; print + save still happens.

## Deployment

Vercel works out of the box. Set the same environment variables in the project settings. Add a Vercel Cron entry pointing at `/api/follow-ups/dispatch` with the `x-cron-secret` header.

## Project layout

```
app/
  (auth)/                      # login, forgot-password
  (super-admin)/               # clinics CRUD, analytics
  (clinic-admin)/              # staff, permissions, earnings
  (doctor)/
    voice-prescription/        # flagship: speak -> AI -> save+email+print
    dashboard, patients, prescriptions, earnings, follow-ups
  (reception)/                 # patients, appointments, follow-ups
  api/
    ai/transcribe              # Groq Whisper proxy
    ai/prescription            # Groq LLaMA-3.3 JSON
    notifications/send         # multi-channel send + log
    follow-ups/dispatch        # cron-triggered reminder dispatch
components/
  voice/, prescriptions/, appointments/, patients/, earnings/,
  follow-ups/, permissions/, layout/, ui/
hooks/
lib/
  supabase/, ai/, notifications/, pdf/
supabase/schema.sql
```

## Out of scope

- Upstash rate limiting (note only).
- OpenAI / Anthropic providers — stub files in `lib/ai/providers/` for future swap; Groq is the live path.

## Architectural Design (MVVM & Repository Pattern)

For the patient management, dashboard counts, and notifications system, we introduced a strict separation of concerns following enterprise guidelines:

### 1. Data Flow Spec
```
UI Component (e.g., PatientForm) 
  ↔ ViewModel Hook (e.g., usePatientViewModel) 
  ↔ Repository (e.g., PatientRepository) 
  ↔ Service Layer (e.g., PatientService) 
  ↔ Supabase API Client
```

### 2. Core Separation
- **Domain Layer (`lib/domain/models/patient.ts`)**: Hosts pure type interfaces (`Patient`, `PatientVitals`) and business rules/input validations (`validatePatientInput`, `validateVitalsInput`). Pure TypeScript, zero frameworks.
- **Service Layer (`lib/services/patientService.ts`)**: Orchestrates the communication with Supabase database clients. Exposes granular, transactional operations.
- **Repository Layer (`lib/repositories/patientRepository.ts`)**: Mediates domain model updates and resolves backend endpoints, acting as a clean contract layer.
- **ViewModel Hook (`hooks/usePatientViewModel.ts`)**: Owns presentation state, coordinates form inputs, performs inputs validation, translates exceptions via the Centralized Error Handler, and exposes submission status indicators.

### 3. Real-Time Sync Mechanism
- **Dashboard Counts**: Receptionist (`ReceptionStats.tsx`) and Doctor (`DoctorStats.tsx`) counting statistics use a client-side component wrapper subscribing to PostgreSQL `postgres_changes` events. When a row changes, it triggers an optimized, atomic count update.
- **Doctor Registration Notifications**: Receptionists mount `PatientNotifier.tsx` on their dashboard. It listens for `INSERT` operations on the `patients` table. If a doctor in the same clinic registers a patient, it dynamically displays a toast alert listing the patient and registering physician.

