import { FollowUpManager } from "@/components/follow-ups/FollowUpManager";

export default function ReceptionFollowUpsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Follow-ups</h1>
        <p className="text-sm text-muted-foreground">Send reminders for upcoming or overdue follow-ups</p>
      </div>
      <FollowUpManager scope="clinic" />
    </div>
  );
}
