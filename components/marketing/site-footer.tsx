import Link from "next/link";
import { Activity } from "lucide-react";
import { footerNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Activity className="h-5 w-5" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-semibold tracking-tight text-ink-900">{siteConfig.name}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-ink-500">
              The voice-first clinic operating system. Dictate the prescription and the visit summary,
              and let your front desk run registration and billing from the same place.
            </p>
          </div>

          {Object.entries(footerNav).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-ink-900">{group}</h3>
              <ul className="mt-4 space-y-3 text-sm">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-ink-500 transition-colors hover:text-ink-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink-200 pt-8 text-sm text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {siteConfig.legalName}. All rights reserved.</p>
          <p>Made for clinics that would rather treat patients than type.</p>
        </div>
      </div>
    </footer>
  );
}
