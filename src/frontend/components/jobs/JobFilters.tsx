"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

const STATUSES = [
  { value: "all",       label: "Alle" },
  { value: "open",      label: "Offen" },
  { value: "assigned",  label: "Vergeben" },
  { value: "completed", label: "Abgeschlossen" },
] as const;

export function JobFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("status") ?? "all";

  function setStatus(status: string) {
    router.push(status === "all" ? "/jobs" : `/jobs?status=${status}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => (
        <Button
          key={s.value}
          size="sm"
          variant={current === s.value ? "default" : "outline"}
          onClick={() => setStatus(s.value)}
        >
          {s.label}
        </Button>
      ))}
    </div>
  );
}
