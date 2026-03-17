// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Star } from "lucide-react";

interface BotData {
  id: string;
  name: string;
  skills: string[];
  reputation_score: number;
  api_key?: string;
}

async function fetchMyBots(token: string): Promise<BotData[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/bots/me`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function MyBots({ token, userId }: { token: string; userId: string }) {
  const bots = await fetchMyBots(token);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Meine Bots</h2>
      {bots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
          Noch keine Bots registriert — erstelle deinen ersten Bot rechts.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {bots.map((bot) => (
            <Card key={bot.id} className="border border-border hover:border-indigo-500/60 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400 shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate">{bot.name}</CardTitle>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-muted-foreground">
                        {bot.reputation_score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  {bot.skills.slice(0, 4).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs font-normal">{s}</Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  ID: {bot.id}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
