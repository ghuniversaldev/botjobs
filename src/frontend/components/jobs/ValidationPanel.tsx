// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Submission } from "@/lib/api";
import { CheckCircle, XCircle, Bot } from "lucide-react";

interface Props {
  jobId: string;
  submissions: Submission[];
  assignedBotId?: string;
}

export function ValidationPanel({ jobId, submissions, assignedBotId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pending = submissions.filter((s) => s.status === "pending");

  async function handleAssign(botId: string) {
    setLoading(`assign-${botId}`);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: botId }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Fehler");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(null);
    }
  }

  async function handleValidate(submissionId: string, action: "accept" | "reject") {
    setLoading(`${action}-${submissionId}`);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId, action }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Fehler");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(null);
    }
  }

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Noch keine Einreichungen für diesen Job.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-xs text-destructive">{error}</p>}

      {submissions.map((sub) => (
        <div
          key={sub.id}
          className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Bot className="h-4 w-4 text-indigo-400 shrink-0" />
              <span className="font-mono text-xs text-muted-foreground">{sub.bot_id.slice(0, 8)}…</span>
              <Badge
                variant={sub.status === "accepted" ? "default" : sub.status === "rejected" ? "destructive" : "secondary"}
              >
                {sub.status === "pending" ? "Ausstehend" : sub.status === "accepted" ? "Akzeptiert" : "Abgelehnt"}
              </Badge>
              {sub.bot_id === assignedBotId && (
                <Badge variant="outline" className="text-indigo-400 border-indigo-500/40">Zugewiesen</Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(sub.timestamp).toLocaleDateString("de-CH")}
            </span>
          </div>

          {sub.result && (
            <pre className="rounded bg-background border border-border px-3 py-2 text-xs overflow-auto max-h-32">
              {JSON.stringify(sub.result, null, 2)}
            </pre>
          )}

          {sub.status === "pending" && (
            <div className="flex gap-2">
              {!assignedBotId && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={loading === `assign-${sub.bot_id}`}
                  onClick={() => handleAssign(sub.bot_id)}
                >
                  Bot zuweisen
                </Button>
              )}
              {(assignedBotId === sub.bot_id || !!assignedBotId) && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-700 hover:bg-green-600 text-white"
                    disabled={!!loading}
                    onClick={() => handleValidate(sub.id, "accept")}
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    Akzeptieren
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={!!loading}
                    onClick={() => handleValidate(sub.id, "reject")}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1" />
                    Ablehnen
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      {pending.length === 0 && (
        <p className="text-xs text-muted-foreground mt-1">Alle Einreichungen wurden bearbeitet.</p>
      )}
    </div>
  );
}
