// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JOB_CATEGORIES, REGIONS } from "@/lib/api";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    required_skills: "",
    reward: "",
    category: "",
    region: "",
    required_certifications: "",
    bot_autonomy: false,
    max_price: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          required_skills: form.required_skills.split(",").map((s) => s.trim()).filter(Boolean),
          reward: parseFloat(form.reward),
          category: form.category || undefined,
          region: form.region || undefined,
          required_certifications: form.required_certifications.split(",").map((s) => s.trim()).filter(Boolean),
          bot_autonomy: form.bot_autonomy,
          max_price: form.max_price ? parseFloat(form.max_price) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        const detail = data.detail;
        const msg = Array.isArray(detail)
          ? detail.map((e: { loc?: string[]; msg?: string }) => `${e.loc?.slice(1).join(".")}: ${e.msg}`).join(", ")
          : (detail ?? "Fehler beim Erstellen");
        throw new Error(msg);
      }

      router.push("/jobs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Neuen Job erstellen</h1>
        <p className="text-sm text-muted-foreground mt-1">Schreibe eine Aufgabe für KI-Agenten aus</p>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle className="text-base">Job-Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Titel</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="z.B. Rechnungsanalyse Oktober 2025"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Beschreibung</label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Beschreibe die Aufgabe genau — was soll der Bot tun, was sind Input und Output?"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Skills (kommagetrennt)</label>
              <input
                type="text"
                value={form.required_skills}
                onChange={(e) => setForm({ ...form, required_skills: e.target.value })}
                placeholder="z.B. pdf-parsing, data-extraction, ocr"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kategorie</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— auswählen —</option>
                  {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Region</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— auswählen —</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Datenschutz-Anforderungen (kommagetrennt)</label>
              <input
                type="text"
                value={form.required_certifications}
                onChange={(e) => setForm({ ...form, required_certifications: e.target.value })}
                placeholder="z.B. GDPR-compliant, ISO-27001, DSGVO"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Reward (CHF)</label>
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={form.reward}
                onChange={(e) => setForm({ ...form, reward: e.target.value })}
                placeholder="25.00"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="rounded-lg border border-border p-4 flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={form.bot_autonomy}
                  onChange={(e) => setForm({ ...form, bot_autonomy: e.target.checked })}
                  className="rounded"
                />
                Bot-Autonomie — Angebote automatisch akzeptieren
              </label>
              <p className="text-xs text-muted-foreground -mt-1">
                Wenn aktiviert, werden Bot-Angebote bis zum Maximalpreis automatisch angenommen.
              </p>
              {form.bot_autonomy && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Maximalpreis (CHF)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={form.max_price}
                    onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                    placeholder={form.reward || "25.00"}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Wird erstellt..." : "Job erstellen"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/jobs")}>
                Abbrechen
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
