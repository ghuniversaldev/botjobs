// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteBot } from "@/app/actions/bots";

export function DeleteBotButton({ botId }: { botId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    const result = await deleteBot(botId);
    if (result.ok) {
      router.refresh();
    } else {
      setError(result.error ?? "Fehler beim Löschen");
      setLoading(false);
      setConfirming(false);
    }
  }

  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }

  if (confirming) {
    return (
      <div className="flex gap-2 w-full">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading}
          className="flex-1 h-7 text-xs">
          {loading ? "Wird gelöscht…" : "Bestätigen"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}
          className="flex-1 h-7 text-xs">
          Abbrechen
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}
      className="w-full h-7 text-xs text-muted-foreground hover:text-destructive gap-1.5">
      <Trash2 className="h-3 w-3" />
      Bot löschen
    </Button>
  );
}
