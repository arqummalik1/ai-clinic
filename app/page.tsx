import Link from "next/link";
import {
  Mic, FileText, Users, Building2, CalendarClock, BellRing, ShieldCheck,
  BarChart3, ArrowRight, Check, Minus, Waves, ReceiptText, Languages, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { StructuredData } from "@/components/marketing/structured-data";

const faqs = [
  {
    q: "Does the doctor have to type anything?",
    a: "No. The doctor speaks the prescription and a short summary of the visit out loud. MediSync transcribes the speech, structures the medicines, dosages, lab tests, and advice, and shows an editable draft. The doctor only reviews and confirms.",
  },
  {
    q: "Can one account run several clinics and many doctors?",
    a: "Yes. MediSync is multi-clinic and multi-doctor by design. An owner manages every location, doctor, and receptionist from one dashboard, with role-based access so each person sees only what they need.",
  },
  {
    q: "What does the receptionist do in MediSync?",
    a: "The front desk registers patients, books appointments into a live token queue, records the consultation fee, and prints or shares the bill. The doctor sees the queue update in real time and calls patients in.",
  },
  {
    q: "Where is patient data stored and is it secure?",
    a: "Every clinic's data is isolated at the database level with row-level security, so one clinic can never read another's records. Prescriptions are stored as access-controlled PDFs and the architecture is built to support healthcare privacy requirements.",
  },
  {
    q: "How long does it take to get started?",
    a: "Most clinics are live in under two minutes. Create your account, add your doctors and receptionists, and start the first voice consult the same day. No installation, no hardware, no credit card for the free plan.",
  },
  {
    q: "What does the free trial include?",
    a: "The free plan covers a single clinic with up to three doctors and includes voice prescriptions, patient records, the appointment queue, and branded PDF prescriptions. Upgrade only when you outgrow it.",
  },
];

const features = [
  {
    icon: Mic,
    title: "Voice prescriptions",
    desc: "Speak naturally during the consult. Medicines, dosages, lab orders, and advice land as a clean, structured draft you simply confirm.",
    accent: true,
  },
  {
    icon: ClipboardList,
    title: "Spoken visit summaries",
    desc: "Dictate the diagnosis and what the patient came in for. MediSync writes it up so the record is complete without a keyboard.",
    accent: true,
  },
  {
    icon: CalendarClock,
    title: "Live appointment queue",
    desc: "Reception adds patients to a token queue; doctors see it update in real time across every screen and call patients in with one tap.",
  },
  {
    icon: ReceiptText,
    title: "Front-desk billing",
    desc: "Record fees, mark payments, and hand the patient a bill at registration. Revenue is captured the moment the visit begins.",
  },
  {
    icon: Users,
    title: "Complete patient records",
    desc: "Prescriptions, visits, vitals, and history in one searchable profile. Patients stop carrying paper and nothing gets lost.",
  },
  {
    icon: Building2,
    title: "Multi-clinic control",
    desc: "Run one practice or a hundred from a single owner dashboard, each with its own doctors, receptionists, and access rules.",
  },
  {
    icon: BellRing,
    title: "Automatic follow-ups",
    desc: "Follow-up reminders are scheduled from the consult and sent by WhatsApp, SMS, or email so patients actually come back.",
  },
  {
    icon: BarChart3,
    title: "Earnings you can see",
    desc: "Track revenue by doctor, by clinic, and by day with clear charts. No spreadsheets, no month-end guesswork.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    desc: "Owner, clinic admin, doctor, receptionist. Each role sees exactly what it should and nothing it shouldn't.",
  },
];

const steps = [
  {
    n: "01",
    title: "Reception checks the patient in",
    desc: "The front desk registers the patient, adds them to today's queue with a token number, and records the fee. The doctor's screen updates instantly.",
    icon: CalendarClock,
  },
  {
    n: "02",
    title: "The doctor speaks the consult",
    desc: "The doctor calls the patient in and talks: the prescription, the diagnosis, and a short summary of why the patient came. No typing during the visit.",
    icon: Mic,
  },
  {
    n: "03",
    title: "MediSync writes it up",
    desc: "Speech becomes a structured prescription and visit summary in seconds. The doctor glances over the draft, edits if needed, and confirms.",
    icon: Waves,
  },
  {
    n: "04",
    title: "Sent, printed, and followed up",
    desc: "A branded PDF is emailed to the patient and printed, the visit is closed, earnings are logged, and the follow-up reminder is scheduled automatically.",
    icon: FileText,
  },
];

const teams = [
  { role: "Clinic owners", desc: "One dashboard for every location, doctor, and rupee earned across the group." },
  { role: "Doctors", desc: "Speak the consult, review the draft, move to the next patient. Records stay complete." },
  { role: "Receptionists", desc: "Register patients, run the queue, take payment, and print the bill in seconds." },
  { role: "Patients", desc: "Clear digital prescriptions by email and timely follow-up reminders, no paper to lose." },
];

const comparison = {
  with: [
    "Prescription and visit summary from the doctor's voice",
    "One queue shared live between reception and doctors",
    "Billing captured at check-in, not reconstructed later",
    "Every clinic and doctor managed from one place",
    "Follow-up reminders sent automatically",
    "Patient history searchable in one profile",
    "Revenue visible by doctor, clinic, and day",
  ],
  without: [
    "Every prescription hand-written or typed out",
    "Paper queues and shouted names in the waiting room",
    "Fees tallied from memory at the end of the day",
    "A separate system, or none, for each location",
    "Staff phoning patients one by one, if at all",
    "History scattered across files and notebooks",
    "Month-end revenue pieced together in a spreadsheet",
  ],
};

const plans = [
  {
    name: "Starter",
    price: "Free",
    cadence: "",
    desc: "For solo doctors getting started.",
    features: ["1 clinic", "Up to 3 doctors", "Voice prescriptions", "Patient records & queue", "Branded PDF prescriptions"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₹2,999",
    cadence: "/month",
    desc: "For busy, growing clinics.",
    features: ["1 clinic", "Unlimited doctors", "Everything in Starter", "WhatsApp & SMS reminders", "Earnings analytics", "Priority support"],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "",
    desc: "For multi-clinic groups & hospitals.",
    features: ["Unlimited clinics", "Everything in Professional", "Group-wide reporting", "Custom onboarding", "Dedicated success manager", "Priority SLA"],
    cta: "Talk to us",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <StructuredData faqs={faqs} />
      <SiteHeader />

      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/70 via-background to-background" />
          <div
            className="absolute inset-x-0 top-0 -z-10 h-[480px] opacity-60"
            style={{
              backgroundImage:
                "radial-gradient(60% 60% at 50% 0%, var(--color-brand-100) 0%, transparent 70%)",
            }}
          />
          <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8 lg:pb-28">
            <div className="mx-auto max-w-3xl text-center rise-in">
              <span className="eyebrow">
                <Waves className="h-4 w-4" />
                Voice-first clinic OS
              </span>
              <h1 className="heading-display mt-5 text-ink-900">
                Speak the consult.
                <br />
                The paperwork{" "}
                <span className="text-brand-600">writes itself.</span>
              </h1>
              <p className="text-lead mx-auto mt-6 max-w-2xl text-ink-600">
                Doctors dictate the prescription and the visit summary out loud. Reception handles
                registration and billing. Owners run every clinic from one place. MediSync turns the
                spoken consult into a finished, shareable record in seconds.
              </p>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/signup">
                  <Button size="xl" className="gap-2">
                    Start your free trial <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="xl" variant="outline">See how it works</Button>
                </a>
              </div>
              <p className="mt-4 text-sm text-ink-500">
                Free for solo practices. No credit card. Live in under two minutes.
              </p>
            </div>

            <HeroVisual />
          </div>
        </section>

        {/* ── Trust bar ──────────────────────────────────────────── */}
        <section className="border-y border-ink-200 bg-ink-50/60">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px overflow-hidden px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
            {[
              { stat: "Under 2 sec", label: "from voice to structured draft" },
              { stat: "One queue", label: "shared live by desk and doctor" },
              { stat: "1 to 1,000", label: "clinics from a single login" },
              { stat: "Zero paper", label: "prescriptions, records, and bills" },
            ].map((item) => (
              <div key={item.label} className="px-2 py-8 text-center">
                <p className="text-2xl font-bold tracking-tight text-ink-900">{item.stat}</p>
                <p className="mt-1 text-sm text-ink-500">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ───────────────────────────────────────────── */}
        <section id="features" className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Everything in one place</span>
              <h2 className="heading-section mt-4 text-ink-900">
                Run the whole clinic, not five apps
              </h2>
              <p className="text-lead mx-auto mt-4 max-w-xl text-ink-600">
                From the front desk to the follow-up, MediSync replaces the paper, the spreadsheets,
                and the disconnected tools clinics juggle today.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="group rounded-2xl border border-ink-200 bg-card p-6 transition-all hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
                  >
                    <span
                      className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${
                        f.accent
                          ? "bg-accent-50 text-accent-700"
                          : "bg-brand-50 text-brand-700"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="text-base font-semibold text-ink-900">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────────────── */}
        <section id="how-it-works" className="border-y border-ink-200 bg-ink-50/60 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">From check-in to follow-up</span>
              <h2 className="heading-section mt-4 text-ink-900">A single, unbroken flow</h2>
              <p className="text-lead mx-auto mt-4 max-w-xl text-ink-600">
                One patient, four quiet steps. No handoffs lost, no notes retyped.
              </p>
            </div>

            <ol className="mt-16 grid gap-6 lg:grid-cols-4">
              {steps.map((s) => {
                const Icon = s.icon;
                return (
                  <li
                    key={s.n}
                    className="relative rounded-2xl border border-ink-200 bg-card p-6"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold tracking-widest text-brand-600">{s.n}</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-ink-900">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.desc}</p>
                  </li>
                );
              })}
            </ol>

            <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-brand-200 bg-brand-50/60 p-6 text-center">
              <p className="text-sm leading-relaxed text-ink-700">
                <span className="font-semibold text-ink-900">In the doctor&apos;s words:</span>{" "}
                &ldquo;Viral fever, prescribe paracetamol 500mg three times a day for five days, blood
                test CBC, plenty of fluids, follow up in three days.&rdquo; That sentence becomes a
                finished prescription, a visit summary, and a scheduled reminder.
              </p>
            </div>
          </div>
        </section>

        {/* ── Teams ──────────────────────────────────────────────── */}
        <section id="teams" className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Built for the whole clinic</span>
              <h2 className="heading-section mt-4 text-ink-900">One platform, every role</h2>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {teams.map((t) => (
                <div key={t.role} className="rounded-2xl border border-ink-200 bg-card p-6">
                  <h3 className="text-base font-semibold text-ink-900">{t.role}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison ─────────────────────────────────────────── */}
        <section className="border-y border-ink-200 bg-ink-50/60 py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">The honest comparison</span>
              <h2 className="heading-section mt-4 text-ink-900">Why clinics make the switch</h2>
            </div>
            <div className="mt-16 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-brand-200 bg-card p-8 shadow-sm">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-brand-700">
                  <Check className="h-5 w-5" /> With MediSync
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {comparison.with.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink-700">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-700">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-ink-200 bg-card p-8">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-ink-500">
                  <Minus className="h-5 w-5" /> The manual way
                </h3>
                <ul className="mt-6 space-y-3.5">
                  {comparison.without.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-ink-500">
                      <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-ink-100 text-ink-400">
                        <Minus className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────── */}
        <section id="pricing" className="py-24 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Simple pricing</span>
              <h2 className="heading-section mt-4 text-ink-900">Start free, scale when you&apos;re ready</h2>
              <p className="text-lead mx-auto mt-4 max-w-xl text-ink-600">
                No setup fees, no lock-in. Every plan begins with a free trial.
              </p>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-2xl border p-8 ${
                    plan.highlighted
                      ? "border-brand-600 bg-card shadow-xl shadow-brand-900/10 ring-1 ring-brand-600"
                      : "border-ink-200 bg-card"
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3 left-8 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-ink-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-ink-500">{plan.desc}</p>
                  <p className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-ink-900">{plan.price}</span>
                    {plan.cadence && <span className="text-sm text-ink-500">{plan.cadence}</span>}
                  </p>
                  <ul className="mt-7 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-ink-700">
                        <Check className="h-4 w-4 flex-none text-brand-600" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="mt-8 block">
                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────── */}
        <section id="faq" className="border-t border-ink-200 bg-ink-50/60 py-24 sm:py-28">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="eyebrow">Questions, answered</span>
              <h2 className="heading-section mt-4 text-ink-900">Before you ask</h2>
            </div>
            <div className="mt-12 divide-y divide-ink-200 rounded-2xl border border-ink-200 bg-card">
              {faqs.map((f) => (
                <details key={f.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-medium text-ink-900">
                    {f.q}
                    <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-ink-100 text-ink-500 transition-transform group-open:rotate-45">
                      <span className="text-lg leading-none">+</span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-brand-700">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(50% 80% at 80% 0%, var(--color-brand-500) 0%, transparent 60%), radial-gradient(40% 70% at 10% 100%, var(--color-brand-900) 0%, transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
            <h2 className="heading-section text-white">
              Treat patients. Let MediSync handle the rest.
            </h2>
            <p className="text-lead mx-auto mt-4 max-w-xl text-brand-100">
              Set up your clinic, add your team, and run your first voice consult today. Free to start.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/signup">
                <Button size="xl" variant="secondary" className="gap-2">
                  Start your free trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="xl" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-brand-200">No credit card required.</p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/* ── Hero visual: a stylized "spoken consult → structured record" mock ── */
function HeroVisual() {
  return (
    <div className="mx-auto mt-16 max-w-4xl rise-in">
      <div className="rounded-3xl border border-ink-200 bg-card p-3 shadow-2xl shadow-brand-900/10">
        <div className="rounded-2xl bg-gradient-to-br from-ink-50 to-brand-50/70 p-5 sm:p-8">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
            {/* Speaking */}
            <div className="flex flex-col justify-between rounded-xl border border-ink-200 bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-700">
                  <Mic className="h-4 w-4" />
                </span>
                Doctor speaking
              </div>
              <div className="mt-4 flex h-10 items-end gap-1" aria-hidden>
                {[5, 9, 14, 8, 18, 12, 22, 10, 16, 7, 13, 6, 11, 17, 9, 4].map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 flex-1 rounded-full bg-accent-400/70"
                    style={{ height: `${h * 4}%` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink-600">
                &ldquo;Viral fever. Paracetamol 500mg, three times daily for five days. CBC. Plenty of
                fluids. Follow up in three days.&rdquo;
              </p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <span className="flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-brand-600 text-white md:rotate-0">
                <ArrowRight className="h-5 w-5" />
              </span>
            </div>

            {/* Structured */}
            <div className="rounded-xl border border-ink-200 bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-ink-500">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <FileText className="h-4 w-4" />
                </span>
                Structured prescription
              </div>
              <dl className="mt-4 space-y-2.5 text-sm">
                <Row label="Diagnosis" value="Viral fever" />
                <Row label="Rx" value="Paracetamol 500mg · TID · 5 days" />
                <Row label="Lab" value="CBC" />
                <Row label="Advice" value="Plenty of fluids" />
                <Row label="Follow-up" value="In 3 days" />
              </dl>
              <div className="mt-4 flex items-center gap-2 border-t border-ink-200 pt-3 text-xs font-medium text-brand-700">
                <Languages className="h-3.5 w-3.5" />
                Emailed, printed, and reminder scheduled
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-400">{label}</dt>
      <dd className="text-right font-medium text-ink-800">{value}</dd>
    </div>
  );
}
