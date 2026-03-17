// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";
import { BOT_TYPES, REGIONS } from "@/lib/api";

export function RegisterBotForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [form, setForm] = useState({
    name: "",
    skills: "",
    bot_type: "",
    region: "",
    certifications: "",
    bot_autonomy: false,
    max_price: "",
    min_price: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          bot_type: form.bot_type || undefined,
          region: form.region || undefined,
          certifications: form.certifications.split(",").map((s) => s.trim()).filter(Boolean),
          bot_autonomy: form.bot_autonomy,
          max_price: form.max_price ? parseFloat(form.max_price) : undefined,
          min_price: form.min_price ? parseFloat(form.min_price) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.detail === "string" ? data.detail : "Fehler");
      }

      const bot = await res.json();
      setApiKey(bot.api_key ?? "");
      setForm({ name: "", skills: "", bot_type: "", region: "", certifications: "", bot_autonomy: false, max_price: "", min_price: "" });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

  return (
    <Card className="border border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-400" />
            Bot registrieren
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={() => setOpen(!open)}>
            <Plus className={`h-4 w-4 transition-transform ${open ? "rotate-45" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent>
          {apiKey ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-green-400 font-medium">✓ Bot registriert!</p>
              <div>
                <p className="text-xs text-muted-foreground mb-1">API Key — jetzt kopieren, wird nicht mehr angezeigt:</p>
                <code className="block rounded bg-muted px-3 py-2 text-xs break-all">{apiKey}</code>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setApiKey(""); setOpen(false); }}>
                Schliessen
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Bot-Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="z.B. InvoiceBot-v2"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Skills (kommagetrennt)</label>
                <input
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="pdf-parsing, ocr"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Bot-Typ</label>
                <select
                  value={form.bot_type}
                  onChange={(e) => setForm({ ...form, bot_type: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— auswählen —</option>
                  {BOT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Region</label>
                <select
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— auswählen —</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Zertifizierungen (kommagetrennt)</label>
                <input
                  value={form.certifications}
                  onChange={(e) => setForm({ ...form, certifications: e.target.value })}
                  placeholder="ISO-27001, GDPR-compliant"
                  className={inputClass}
                />
              </div>
              <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.bot_autonomy}
                    onChange={(e) => setForm({ ...form, bot_autonomy: e.target.checked })}
                    className="rounded"
                  />
                  Bot-Autonomie (auto-akzeptiert Angebote innerhalb Preisgrenzen)
                </label>
                {form.bot_autonomy && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Min. Preis (CHF)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.min_price}
                        onChange={(e) => setForm({ ...form, min_price: e.target.value })}
                        placeholder="z.B. 10"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Max. Preis (CHF)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.max_price}
                        onChange={(e) => setForm({ ...form, max_price: e.target.value })}
                        placeholder="z.B. 100"
                        className={inputClass}
                      />
                    </div>
                  </div>
                )}
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? "Registriere..." : "Bot erstellen"}
              </Button>
            </form>
          )}
        </CardContent>
      )}
    </Card>
  );
}
