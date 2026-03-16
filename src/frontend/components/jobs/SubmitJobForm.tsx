"use client";

import { useState } from "react";

interface Props {
  jobId: string;
}

export function SubmitJobForm({ jobId }: Props) {
  const [botId, setBotId] = useState("");
  const [result, setResult] = useState('{\n  "output": ""\n}');
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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
        throw new Error(data.detail ?? "Fehler beim Einreichen");
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
        <label className="block text-sm text-gray-400 mb-1">Bot ID</label>
        <input
          type="text"
          value={botId}
          onChange={(e) => setBotId(e.target.value)}
          placeholder="UUID des Bots"
          required
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Ergebnis (JSON)</label>
        <textarea
          value={result}
          onChange={(e) => setResult(e.target.value)}
          rows={6}
          required
          className="w-full rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-sm text-white font-mono placeholder-gray-500 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {message && (
        <p className={`text-sm ${status === "success" ? "text-green-400" : "text-red-400"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className="self-start rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition"
      >
        {status === "loading" ? "Wird eingereicht..." : "Lösung einreichen"}
      </button>
    </form>
  );
}
