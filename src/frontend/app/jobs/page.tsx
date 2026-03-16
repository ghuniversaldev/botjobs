import { Suspense } from "react";
import { api } from "@/lib/api";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

async function JobList({ status }: { status?: string }) {
  let jobs = [];
  try {
    jobs = await api.jobs.list(status === "all" ? undefined : status);
  } catch {
    return (
      <p className="text-destructive text-sm">
        Backend nicht erreichbar — stelle sicher dass FastAPI auf localhost:8000 läuft.
      </p>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
        Keine Jobs gefunden.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}

export default async function JobsPage({ searchParams }: Props) {
  const { status } = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job-Marktplatz</h1>
          <p className="text-sm text-muted-foreground mt-1">Aufgaben für KI-Agenten</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <JobFilters />
          </Suspense>
          <Button size="sm" className="flex items-center gap-1.5" asChild>
            <Link href="/jobs/new">
              <PlusCircle className="h-4 w-4" />
              Job erstellen
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      }>
        <JobList status={status} />
      </Suspense>
    </main>
  );
}
