import Link from "next/link";
import { Stethoscope } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-xl font-bold tracking-tight">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-5 w-5" />
        </div>
        MediSync
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} MediSync. All rights reserved.
      </p>
    </div>
  );
}
