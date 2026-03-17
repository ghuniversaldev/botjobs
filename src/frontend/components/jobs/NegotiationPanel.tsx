// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Check, X, Bot } from "lucide-react";

interface HistoryEntry {
  actor: "user" | "bot";
  price: number;
  timestamp: string;
}

interface Negotiation {
  id: string;
  bot_id: string;
  current_price: number;
  initial_price: number;
  status: string;
  history: HistoryEntry[];
  bot_autonomy: boolean;
  max_price?: number;
}

interface Props {
  jobId: string;
  jobReward: number;
  isOwner: boolean;
}

export function NegotiationPanel({ jobId, jobReward, isOwner }: Props) {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [counterPrice, setCounterPrice] = useState<Record<string, string>>({});
  const [offerPrice, setOfferPrice] = useState("");
  const [offerBotId, setOfferBotId] = useState("");
  const [botAutonomy, setBotAutonomy] = useState(false);
  const [maxPrice, setMaxPrice] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/jobs/${jobId}/negotiation`);
    if (res.ok) setNegotiations(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [jobId]);

  async function makeOffer() {
    setError("");
    const res = await fetch(`/api/jobs/${jobId}/negotiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        price: parseFloat(offerPrice),
        bot_id: offerBotId,
        bot_autonomy: botAutonomy,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.detail ?? "Fehler");
    } else {
      setOfferPrice(""); setOfferBotId(""); setBotAutonomy(false); setMaxPrice("");
      await load();
    }
  }

  async function counter(negId: string, price: string) {
    setError("");
    const res = await fetch(`/api/jobs/${jobId}/counter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: parseFloat(price) }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.detail ?? "Fehler");
    } else {
      setCounterPrice((p) => ({ ...p, [negId]: "" }));
      await load();
    }
  }

  async function accept() {
    const res = await fetch(`/api/jobs/${jobId}/negotiation/accept`, { method: "POST" });
    if (res.ok) await load();
  }

  async function reject() {
    const res = await fetch(`/api/jobs/${jobId}/negotiation/reject`, { method: "POST" });
    if (res.ok) await load();
  }

  const statusVariant: Record<string, string> = {
    open: "bg-yellow-900 text-yellow-300",
    accepted: "bg-green-900 text-green-300",
    rejected: "bg-gray-800 text-gray-400",
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          Preisverhandlung
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">

        {/* New offer form (bot owner / non-owner) */}
        {!isOwner && (
          <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Angebot machen</p>
            <input
              placeholder="Bot ID"
              value={offerBotId}
              onChange={(e) => setOfferBotId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder={`Preis (Listenpreis: ${jobReward} CHF)`}
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={botAutonomy}
                onChange={(e) => setBotAutonomy(e.target.checked)}
                className="rounded"
              />
              Bot-Autonomie (auto-akzeptieren innerhalb Preisgrenzen)
            </label>
            {botAutonomy && (
              <input
                type="number"
                placeholder="Max. akzeptierbarer Preis (CHF)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            )}
            <Button size="sm" onClick={makeOffer} disabled={!offerPrice || !offerBotId}>
              Angebot senden
            </Button>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Active negotiations */}
        {loading ? (
          <div className="h-12 rounded bg-muted animate-pulse" />
        ) : negotiations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Verhandlungen.</p>
        ) : (
          negotiations.map((neg) => (
            <div key={neg.id} className="flex flex-col gap-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                    {neg.bot_id.slice(0, 12)}…
                  </span>
                  {neg.bot_autonomy && (
                    <Badge variant="outline" className="text-xs">Auto</Badge>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusVariant[neg.status] ?? ""}`}>
                  {neg.status}
                </span>
              </div>

              {/* History */}
              <div className="flex flex-col gap-1">
                {neg.history.map((h, i) => (
                  <div key={i} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                    h.actor === "bot" ? "bg-indigo-950/40 text-indigo-300" : "bg-muted text-muted-foreground"
                  }`}>
                    <span>{h.actor === "bot" ? "Bot" : "Du"}</span>
                    <span className="font-semibold">{h.price.toLocaleString("de-CH")} CHF</span>
                  </div>
                ))}
              </div>

              {/* Current price */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Aktuell</span>
                <span className="font-bold text-indigo-400">
                  {neg.current_price.toLocaleString("de-CH")} CHF
                </span>
              </div>

              {/* Actions */}
              {neg.status === "open" && isOwner && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Gegenangebot CHF"
                      value={counterPrice[neg.id] ?? ""}
                      onChange={(e) => setCounterPrice((p) => ({ ...p, [neg.id]: e.target.value }))}
                      className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <Button size="sm" variant="outline"
                      onClick={() => counter(neg.id, counterPrice[neg.id] ?? "")}
                      disabled={!counterPrice[neg.id]}>
                      Gegenbieten
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gap-1" onClick={accept}>
                      <Check className="h-3.5 w-3.5" /> Akzeptieren
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={reject}>
                      <X className="h-3.5 w-3.5" /> Ablehnen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
