"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { toggleStaffActive } from "@/app/(clinic-admin)/clinic-admin/users/actions";

export function StaffStatusToggle({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    const next = !active;
    startTransition(async () => {
      const result = await toggleStaffActive(userId, next);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      setActive(next);
      toast.success(next ? "Staff member activated" : "Staff member deactivated");
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      variant={active ? "outline" : "default"}
      onClick={onToggle}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : active ? (
        <PowerOff className="mr-2 h-4 w-4" />
      ) : (
        <Power className="mr-2 h-4 w-4" />
      )}
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
