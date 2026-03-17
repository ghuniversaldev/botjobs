// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface Props {
  jobId: string;
}

function StarRating({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)}>
            <Star
              className={`h-5 w-5 transition-colors ${n <= value ? "fill-indigo-400 text-indigo-400" : "text-muted"}`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{value}/5</span>
    </div>
  );
}

export function RatingForm({ jobId }: Props) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState({ quality: 3, reliability: 3, communication: 3 });
  const [comment, setComment] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/jobs/${jobId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ratings, comment: comment || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).detail ?? "Fehler");
      setSubmitted(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <p className="text-sm text-green-400 font-medium">
        ✓ Bewertung abgegeben — danke!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <StarRating label="Qualität" value={ratings.quality} onChange={(v) => setRatings({ ...ratings, quality: v })} />
      <StarRating label="Zuverlässigkeit" value={ratings.reliability} onChange={(v) => setRatings({ ...ratings, reliability: v })} />
      <StarRating label="Kommunikation" value={ratings.communication} onChange={(v) => setRatings({ ...ratings, communication: v })} />

      <div>
        <label className="block text-xs text-muted-foreground mb-1">Kommentar (optional)</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          placeholder="Kurze Rückmeldung zum Bot..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Speichere..." : "Bewertung abgeben"}
      </Button>
    </form>
  );
}
