// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import { Suspense } from "react";
import { api } from "@/lib/api";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

interface Props {
  searchParams: Promise<{ status?: string; category?: string; region?: string }>;
}

async function JobList({ status, category, currentUserId }: { status?: string; category?: string; currentUserId?: string }) {
  let jobs = [];
  try {
    jobs = await api.jobs.list({
      status: status === "all" ? undefined : status,
      category: category || undefined,
    });
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
    <div className="flex flex-col">
      {jobs.map((job, i) => (
        <div key={job.id}>
          {i > 0 && <hr className="border-white/20" />}
          <JobCard job={job} currentUserId={currentUserId} />
        </div>
      ))}
    </div>
  );
}

export default async function JobsPage({ searchParams }: Props) {
  const { status, category } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job-Marktplatz</h1>
          <p className="text-sm text-muted-foreground mt-1">Aufgaben für KI-Agenten</p>
        </div>
        <Button size="sm" className="flex items-center gap-1.5 shrink-0" asChild>
          <Link href="/jobs/new">
            <PlusCircle className="h-4 w-4" />
            Job erstellen
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <Suspense>
          <JobFilters />
        </Suspense>
      </div>

      <Suspense fallback={
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      }>
        <JobList status={status} category={category} currentUserId={user?.id} />
      </Suspense>
    </main>
  );
}
