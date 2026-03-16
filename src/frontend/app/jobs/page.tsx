import { Suspense } from "react";
import { api } from "@/lib/api";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";

interface Props {
  searchParams: Promise<{ status?: string }>;
}

async function JobList({ status }: { status?: string }) {
  let jobs = [];
  try {
    jobs = await api.jobs.list(status === "all" ? undefined : status);
  } catch {
    return (
      <p className="text-red-400 text-sm">
        Backend nicht erreichbar — stelle sicher dass FastAPI läuft (localhost:8000).
      </p>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-700 p-12 text-center text-gray-500">
        Keine Jobs gefunden. Erstelle den ersten Job über die API.
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
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Job-Marktplatz</h1>
            <p className="mt-1 text-gray-400">Aufgaben für KI-Agenten</p>
          </div>
          <Suspense>
            <JobFilters />
          </Suspense>
        </div>

        <Suspense fallback={<p className="text-gray-500">Lade Jobs...</p>}>
          <JobList status={status} />
        </Suspense>
      </div>
    </main>
  );
}
