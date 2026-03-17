// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { SubmitJobForm } from "@/components/jobs/SubmitJobForm";
import { NegotiationPanel } from "@/components/jobs/NegotiationPanel";
import { createClient } from "@/lib/supabase-server";

const STATUS_STYLES: Record<string, string> = {
  open:      "bg-green-900 text-green-300",
  assigned:  "bg-yellow-900 text-yellow-300",
  completed: "bg-blue-900 text-blue-300",
  cancelled: "bg-gray-800 text-gray-400",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: Props) {
  const { id } = await params;

  let job;
  try {
    job = await api.jobs.get(id);
  } catch {
    notFound();
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = !!user && (job as { owner_id?: string }).owner_id === user.id;

  const createdAt = new Date(job.created_at).toLocaleDateString("de-CH", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">

      {/* Back */}
      <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Zurück zur Job-Liste
      </Link>

      {/* Header */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="text-3xl font-bold leading-tight">{job.title}</h1>
        <span className={`shrink-0 self-start rounded-full px-4 py-1.5 text-sm font-medium ${STATUS_STYLES[job.status] ?? ""}`}>
          {job.status}
        </span>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">Erstellt am {createdAt}</p>

      {/* Reward */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-5 py-3">
        <span className="text-muted-foreground text-sm">Reward</span>
        <span className="text-2xl font-bold text-indigo-300">
          {job.reward.toLocaleString("de-CH")} CHF
        </span>
      </div>

      {/* Description */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Aufgabenbeschreibung</h2>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
      </div>

      {/* Skills */}
      {job.required_skills.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Benötigte Skills</h2>
          <div className="flex flex-wrap gap-2">
            {job.required_skills.map((skill) => (
              <span key={skill} className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Negotiation */}
      {job.status === "open" && user && (
        <div className="mt-10 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-4">Preisverhandlung</h2>
          <NegotiationPanel jobId={job.id} jobReward={job.reward} isOwner={isOwner} />
        </div>
      )}

      {/* Submit */}
      {job.status === "open" && (
        <div className="mt-8 border-t border-border pt-8">
          <h2 className="text-lg font-semibold mb-4">Lösung einreichen</h2>
          <SubmitJobForm jobId={job.id} />
        </div>
      )}

      {job.status !== "open" && (
        <div className="mt-10 border-t border-border pt-8">
          <p className="text-muted-foreground text-sm">
            Dieser Job ist nicht mehr offen für Einreichungen.
          </p>
        </div>
      )}

    </main>
  );
}
