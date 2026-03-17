// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import { BriefcaseBusiness, Bot, CheckCircle, MessageSquare, Zap } from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  metadata: Record<string, unknown>;
  timestamp: string;
  job_id?: string;
  bot_id?: string;
}

const ACTION_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  job_created:           { label: "Job erstellt",            icon: <BriefcaseBusiness className="h-3.5 w-3.5" /> },
  bot_registered:        { label: "Bot registriert",         icon: <Bot className="h-3.5 w-3.5" /> },
  job_submitted:         { label: "Lösung eingereicht",      icon: <CheckCircle className="h-3.5 w-3.5" /> },
  job_completed:         { label: "Job abgeschlossen",       icon: <CheckCircle className="h-3.5 w-3.5" /> },
  negotiation_started:   { label: "Verhandlung gestartet",   icon: <MessageSquare className="h-3.5 w-3.5" /> },
  negotiation_accepted:  { label: "Verhandlung akzeptiert",  icon: <Zap className="h-3.5 w-3.5" /> },
};

async function fetchActivity(token: string): Promise<ActivityEntry[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/activity`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function ActivityLogPanel({ token }: { token: string }) {
  const entries = await fetchActivity(token);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Aktivitätsprotokoll</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Aktivitäten.</p>
      ) : (
        <div className="flex flex-col gap-1">
          {entries.map((e) => {
            const cfg = ACTION_CONFIG[e.action] ?? { label: e.action, icon: <Zap className="h-3.5 w-3.5" /> };
            const title = (e.metadata?.title as string) ?? (e.metadata?.name as string) ?? "";
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground shrink-0">{cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm">{cfg.label}</span>
                  {title && <span className="text-sm text-muted-foreground"> — {title}</span>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(e.timestamp).toLocaleDateString("de-CH", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
