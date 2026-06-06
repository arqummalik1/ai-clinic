"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { toggleClinicActive } from "@/app/(super-admin)/super-admin/clinics/actions";

export function ClinicStatusToggle({ clinicId, isActive }: { clinicId: string; isActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();

  const onToggle = () => {
    const next = !active;
    startTransition(async () => {
      const result = await toggleClinicActive(clinicId, next);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      setActive(next);
      toast.success(next ? "Clinic enabled" : "Clinic disabled");
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
      {active ? "Disable clinic" : "Enable clinic"}
    </Button>
  );
}
