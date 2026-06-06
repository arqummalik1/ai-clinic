import Link from "next/link";
import {
  Stethoscope, Mic, FileText, Users, Building2, Calendar,
  Bell, Shield, BarChart3, Zap, ArrowRight, Check, X, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ─── Navbar ─── */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Stethoscope className="h-5 w-5" />
            </div>
            MediSync
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#why" className="hover:text-foreground transition-colors">Why MediSync</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 25% 25%, hsl(224 71% 56% / 0.12) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(262 83% 58% / 0.10) 0%, transparent 50%)" }} />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              AI-powered clinic management
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Speak the prescription.
              <br />
              <span className="bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
                AI handles the rest.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              MediSync is the all-in-one platform for modern clinics. Voice-to-prescription in seconds,
              smart appointment queues, patient records, staff management &mdash; whether you run one clinic or a thousand.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 px-8 text-base">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  See how it works
                </Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required. Free for up to 3 doctors.</p>
          </div>

          {/* Hero visual mock */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="rounded-2xl border bg-white p-2 shadow-2xl shadow-blue-900/10">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 p-6 sm:p-10">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                      <Mic className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold">1. Speak</p>
                    <p className="mt-1 text-xs text-muted-foreground">Record the prescription with your voice</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold">2. AI processes</p>
                    <p className="mt-1 text-xs text-muted-foreground">Structured prescription in &lt; 2 seconds</p>
                  </div>
                  <div className="rounded-lg border bg-white p-4 shadow-sm">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold">3. Done</p>
                    <p className="mt-1 text-xs text-muted-foreground">PDF emailed, printed & follow-up set</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything your clinic needs</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              One platform to replace paper, spreadsheets, and 5 different apps.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Mic, title: "Voice prescriptions", desc: "Speak naturally. AI transcribes, structures medicines, dosages, lab tests, and advice into a clean prescription — in under 2 seconds.", color: "bg-red-100 text-red-600" },
              { icon: Calendar, title: "Smart appointment queue", desc: "Real-time token-based queue. Receptionists add patients, doctors call them in. Live updates across every screen.", color: "bg-blue-100 text-blue-600" },
              { icon: Users, title: "Patient records", desc: "Complete history — prescriptions, visits, vitals, allergies — all searchable. Patients never carry paper again.", color: "bg-emerald-100 text-emerald-600" },
              { icon: Building2, title: "Multi-clinic at scale", desc: "One clinic or a thousand — manage them all from a single super-admin dashboard with role-based access.", color: "bg-purple-100 text-purple-600" },
              { icon: Bell, title: "Auto follow-ups", desc: "AI schedules follow-up reminders and sends them via WhatsApp, SMS, or email. No patient falls through the cracks.", color: "bg-amber-100 text-amber-600" },
              { icon: BarChart3, title: "Earnings & analytics", desc: "Track revenue per doctor, per clinic, per day. Beautiful charts give you instant financial visibility.", color: "bg-indigo-100 text-indigo-600" },
              { icon: Shield, title: "Role-based access", desc: "Super-admin, clinic admin, doctor, receptionist — each role sees exactly what they need. Nothing more.", color: "bg-slate-100 text-slate-600" },
              { icon: FileText, title: "Branded PDFs", desc: "Every prescription is a professional PDF with your clinic's branding, doctor's signature, and secure storage.", color: "bg-pink-100 text-pink-600" },
              { icon: Zap, title: "Built for speed", desc: "Next.js, Supabase, and edge-deployed AI. Pages load in milliseconds. Prescriptions generate in seconds.", color: "bg-yellow-100 text-yellow-700" },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${f.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
            <p className="mt-4 text-lg text-muted-foreground">From voice to prescription in three steps.</p>
          </div>
          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            {[
              { step: "01", title: "Doctor speaks", desc: "The doctor opens the voice prescription page, selects the patient, and speaks naturally — \"Patient has viral fever, prescribe Paracetamol 500mg thrice daily for 5 days, blood test CBC, drink plenty of fluids, follow up in 3 days.\"", icon: Mic },
              { step: "02", title: "AI structures it", desc: "Whisper transcribes the audio, LLaMA extracts diagnosis, medicines with dosage, lab tests, advice, and follow-up days — all in a structured JSON. Takes under 2 seconds.", icon: Sparkles },
              { step: "03", title: "Review & send", desc: "The doctor reviews the editable prescription preview, makes any changes, then saves it. PDF is generated, emailed to the patient, printed, and a follow-up is auto-scheduled.", icon: FileText },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="relative">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                    {s.step}
                  </div>
                  <h3 className="text-xl font-semibold">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                  <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Why MediSync (Pros & Cons) ─── */}
      <section id="why" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Why clinics switch to MediSync</h2>
            <p className="mt-4 text-lg text-muted-foreground">Honest comparison — we believe in transparency.</p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {/* With MediSync */}
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.02] p-8">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-primary">
                <Check className="h-5 w-5" /> With MediSync
              </h3>
              <ul className="space-y-4">
                {[
                  "Prescription ready in under 2 seconds from voice",
                  "Zero paper — everything digital and searchable",
                  "Manage 1 or 1,000 clinics from one dashboard",
                  "Automatic follow-up reminders via WhatsApp/SMS/Email",
                  "Role-based access — doctors, receptionists, admins",
                  "Professional branded PDF prescriptions",
                  "Real-time appointment queue with live updates",
                  "Revenue analytics per doctor, per clinic, per day",
                  "Patient history accessible anytime, anywhere",
                  "HIPAA-ready data architecture",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Traditional way */}
            <div className="rounded-2xl border bg-white p-8">
              <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-muted-foreground">
                <X className="h-5 w-5" /> Traditional clinics
              </h3>
              <ul className="space-y-4">
                {[
                  "Hand-write or type every prescription manually",
                  "Paper files that get lost, damaged, or misfiled",
                  "Separate software for each clinic location",
                  "Staff manually calls patients for follow-ups",
                  "No access control — everyone sees everything",
                  "No standard format for prescriptions",
                  "Appointment books or basic spreadsheets",
                  "Monthly revenue calculated manually in Excel",
                  "Patient history only available at the clinic",
                  "Scattered data across notebooks and computers",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── For Everyone ─── */}
      <section className="bg-slate-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Built for everyone in healthcare</h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { role: "Clinic Owners", desc: "Bird's-eye view of all clinics, revenue, and staff performance from one dashboard." },
              { role: "Doctors", desc: "Voice prescriptions, patient history, earnings tracking, and follow-up management." },
              { role: "Receptionists", desc: "Appointment queue, patient registration, and real-time queue management." },
              { role: "Patients", desc: "Receive digital prescriptions via email, track appointments, and get follow-up reminders." },
            ].map((r) => (
              <div key={r.role} className="rounded-xl border bg-white p-6 text-center shadow-sm">
                <h3 className="text-base font-semibold">{r.role}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section id="pricing" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground">Start free. Scale when you&apos;re ready.</p>
          </div>
          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              { name: "Starter", price: "Free", desc: "Perfect for solo doctors", features: ["1 clinic", "Up to 3 doctors", "Voice prescriptions", "Patient records", "Email support"], cta: "Get started", highlighted: false },
              { name: "Professional", price: "₹2,999/mo", desc: "For growing clinics", features: ["1 clinic", "Unlimited doctors", "Everything in Starter", "WhatsApp/SMS reminders", "Earnings analytics", "Priority support"], cta: "Start free trial", highlighted: true },
              { name: "Enterprise", price: "Custom", desc: "For clinic chains & hospitals", features: ["Unlimited clinics", "Everything in Pro", "Custom integrations", "Dedicated account manager", "SLA guarantee", "On-premise option"], cta: "Contact sales", highlighted: false },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-8 ${plan.highlighted ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary" : "bg-white"}`}>
                {plan.highlighted && (
                  <span className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Most popular</span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                <p className="mt-4 text-3xl font-extrabold">{plan.price}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500" /> {f}
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

      {/* ─── CTA ─── */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Ready to modernize your clinic?
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Join thousands of doctors who switched to voice-first prescriptions.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2 px-8 text-base">
                Create your clinic <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t bg-slate-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Stethoscope className="h-4 w-4" />
                </div>
                MediSync
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                AI-powered clinic management platform. Speak the prescription, we handle the rest.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground">How it works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Company</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Legal</h4>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Privacy policy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of service</a></li>
                <li><a href="#" className="hover:text-foreground">HIPAA compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MediSync. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
