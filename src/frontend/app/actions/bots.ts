// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use server";

import { createClient } from "@/lib/supabase-server";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function deleteBot(botId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { ok: false, error: "Nicht angemeldet" };
  }

  const res = await fetch(`${API}/bots/${botId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (res.status === 204 || res.ok) return { ok: true };

  const text = await res.text();
  let detail = text;
  try { detail = JSON.parse(text).detail ?? text; } catch { /* noop */ }
  return { ok: false, error: detail };
}
