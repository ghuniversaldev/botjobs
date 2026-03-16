import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BriefcaseBusiness } from "lucide-react";
import type { Job } from "@/lib/api";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  open: "default",
  assigned: "secondary",
  completed: "outline",
  cancelled: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  open: "Offen",
  assigned: "Vergeben",
  completed: "Abgeschlossen",
  cancelled: "Abgebrochen",
};

async function fetchMyJobs(token: string): Promise<Job[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/jobs/me`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function MyJobs({ token }: { token: string }) {
  const jobs = await fetchMyJobs(token);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Meine Jobs</h2>
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          Noch keine Jobs erstellt —{" "}
          <Link href="/jobs/new" className="text-indigo-400 hover:underline">
            Job erstellen
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:border-indigo-500/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <BriefcaseBusiness className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{job.title}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-sm font-semibold text-indigo-400">
                  {job.reward.toLocaleString("de-CH")} CHF
                </span>
                <Badge variant={STATUS_VARIANT[job.status] ?? "outline"} className="text-xs">
                  {STATUS_LABEL[job.status] ?? job.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
