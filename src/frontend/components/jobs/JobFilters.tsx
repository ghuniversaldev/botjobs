"use client";

import { useRouter, useSearchParams } from "next/navigation";

const STATUSES = ["all", "open", "assigned", "completed"] as const;

export function JobFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("status") ?? "all";

  function setStatus(status: string) {
    const url = status === "all" ? "/jobs" : `/jobs?status=${status}`;
    router.push(url);
  }

  return (
    <div className="flex gap-2">
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => setStatus(s)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            current === s
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  );
}
