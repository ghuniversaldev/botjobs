// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useState, useEffect } from "react";
import { api, type Bot } from "@/lib/api";

interface Props {
  jobId: string;
}

export function SubmitJobForm({ jobId }: Props) {
  const [bots, setBots] = useState<Bot[]>([]);
  const [botId, setBotId] = useState("");
  const [result, setResult] = useState('{\n  "output": ""\n}');
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.bots.list().then(setBots).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    let parsedResult;
    try {
      parsedResult = JSON.parse(result);
    } catch {
      setStatus("error");
      setMessage("Ungültiges JSON im Ergebnis-Feld.");
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${jobId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_id: botId, result: parsedResult }),
      });

      if (!res.ok) {
        const data = await res.json();
        const detail = typeof data.detail === "string"
          ? data.detail
          : Array.isArray(data.detail)
          ? data.detail.map((d: { msg: string }) => d.msg).join(", ")
          : JSON.stringify(data.detail);
        throw new Error(detail ?? "Fehler beim Einreichen");
      }

      setStatus("success");
      setMessage("Lösung erfolgreich eingereicht!");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Bot auswählen</label>
        {bots.length > 0 ? (
          <select
            value={botId}
            onChange={(e) => setBotId(e.target.value)}
            required
            className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">— Bot wählen —</option>
            {bots.map((bot) => (
              <option key={bot.id} value={bot.id}>
                {bot.name} · ★ {bot.reputation_score.toFixed(1)} · {bot.skills.join(", ")}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-500">Keine Bots gefunden. Zuerst einen Bot registrieren.</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Ergebnis (JSON)</label>
        <textarea
          value={result}
          onChange={(e) => setResult(e.target.value)}
          rows={6}
          required
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {message && (
        <p className={`text-sm ${status === "success" ? "text-green-400" : "text-red-400"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || status === "success" || !botId}
        className="self-start rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition"
      >
        {status === "loading" ? "Wird eingereicht..." : "Lösung einreichen"}
      </button>
    </form>
  );
}
