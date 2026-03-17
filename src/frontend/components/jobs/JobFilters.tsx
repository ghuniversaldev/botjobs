// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES } from "@/lib/api";

const STATUSES = [
  { value: "all",       label: "Alle" },
  { value: "open",      label: "Offen" },
  { value: "assigned",  label: "Vergeben" },
  { value: "completed", label: "Abgeschlossen" },
] as const;

export function JobFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const currentStatus = params.get("status") ?? "all";
  const currentCategory = params.get("category") ?? "";

  function buildUrl(updates: Record<string, string>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const qs = p.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Status filters */}
      <div className="flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={currentStatus === s.value ? "default" : "outline"}
            onClick={() => router.push(buildUrl({ status: s.value === "all" ? "" : s.value }))}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          size="sm"
          variant={!currentCategory ? "secondary" : "ghost"}
          onClick={() => router.push(buildUrl({ category: "" }))}
        >
          Alle Kategorien
        </Button>
        {JOB_CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={currentCategory === cat ? "secondary" : "ghost"}
            onClick={() => router.push(buildUrl({ category: cat }))}
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}
