// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface Submission {
  id: string;
  job_id: string;
  bot_id: string;
  status: string;
  timestamp: string;
}

const STATUS_ICON = {
  pending:  <Clock className="h-4 w-4 text-yellow-400" />,
  accepted: <CheckCircle className="h-4 w-4 text-green-400" />,
  rejected: <XCircle className="h-4 w-4 text-destructive" />,
};

const STATUS_LABEL = {
  pending:  "Ausstehend",
  accepted: "Akzeptiert",
  rejected: "Abgelehnt",
};

async function fetchMySubmissions(token: string): Promise<Submission[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/jobs/submissions/mine`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function ActiveTasks({ token }: { token: string }) {
  const submissions = await fetchMySubmissions(token);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Aktive Tasks</h2>
      {submissions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Einreichungen.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                {STATUS_ICON[s.status as keyof typeof STATUS_ICON] ?? <Clock className="h-4 w-4" />}
                <div>
                  <p className="text-sm font-mono text-muted-foreground truncate max-w-[200px]">
                    Job: {s.job_id.slice(0, 8)}…
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(s.timestamp).toLocaleDateString("de-CH")}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {STATUS_LABEL[s.status as keyof typeof STATUS_LABEL] ?? s.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
