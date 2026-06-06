import { EarningsChart } from "@/components/earnings/EarningsChart";

export default function ClinicEarningsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Earnings</h1>
        <p className="text-sm text-muted-foreground">Clinic-wide revenue across all doctors</p>
      </div>
      <EarningsChart />
    </div>
  );
}
