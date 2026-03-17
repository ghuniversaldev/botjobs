// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

/**
 * Typed API client for the FastAPI backend.
 * Pass the Supabase session token for authenticated calls.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const JOB_CATEGORIES = [
  "Datenanalyse", "Textgenerierung", "Code-Entwicklung", "Bildverarbeitung",
  "Webrecherche", "Kundenservice", "Übersetzung", "Automatisierung",
  "Finanzanalyse", "Sonstiges",
] as const;

export const BOT_TYPES = [
  "Generalist", "Spezialist", "Research", "Code", "Creative", "Analysis",
] as const;

export const REGIONS = ["Schweiz", "Deutschland", "Österreich", "EU", "Global"] as const;

export interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  reward: number;
  owner_id?: string;
  status: "open" | "assigned" | "completed" | "rejected" | "cancelled";
  category?: string;
  region?: string;
  assigned_bot_id?: string;
  assigned_at?: string;
  created_at: string;
}

export interface Bot {
  id: string;
  name: string;
  skills: string[];
  owner: string;
  reputation_score: number;
  bot_type?: string;
  region?: string;
  certifications: string[];
  created_at: string;
}

export interface Submission {
  id: string;
  job_id: string;
  bot_id: string;
  result: unknown;
  status: "pending" | "accepted" | "rejected";
  timestamp: string;
}

export interface Rating {
  id: string;
  job_id: string;
  bot_id: string;
  rater_id: string;
  quality: number;
  reliability: number;
  communication: number;
  comment?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  job_id: string;
  bot_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  status: "pending" | "released" | "rejected";
  created_at: string;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`API ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  jobs: {
    list: (params?: { status?: string; category?: string; region?: string; min_reward?: number; max_reward?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.category) qs.set("category", params.category);
      if (params?.region) qs.set("region", params.region);
      if (params?.min_reward != null) qs.set("min_reward", String(params.min_reward));
      if (params?.max_reward != null) qs.set("max_reward", String(params.max_reward));
      const q = qs.toString();
      return apiFetch<Job[]>(`/jobs${q ? `?${q}` : ""}`);
    },
    get: (id: string) => apiFetch<Job>(`/jobs/${id}`),
    create: (payload: Omit<Job, "id" | "status" | "created_at">, token: string) =>
      apiFetch<Job>("/jobs", { method: "POST", body: JSON.stringify(payload), token }),
    assign: (jobId: string, botId: string, token: string) =>
      apiFetch<{ status: string; bot_id: string }>(`/jobs/${jobId}/assign`, {
        method: "POST", body: JSON.stringify({ bot_id: botId }), token,
      }),
    validate: (jobId: string, submissionId: string, action: "accept" | "reject", token: string) =>
      apiFetch<{ status: string }>(`/jobs/${jobId}/validate`, {
        method: "POST", body: JSON.stringify({ submission_id: submissionId, action }), token,
      }),
    rate: (jobId: string, payload: { quality: number; reliability: number; communication: number; comment?: string }, token: string) =>
      apiFetch<Rating>(`/jobs/${jobId}/rate`, {
        method: "POST", body: JSON.stringify(payload), token,
      }),
  },
  bots: {
    list: (params?: { bot_type?: string; region?: string; skill?: string }) => {
      const qs = new URLSearchParams();
      if (params?.bot_type) qs.set("bot_type", params.bot_type);
      if (params?.region) qs.set("region", params.region);
      if (params?.skill) qs.set("skill", params.skill);
      const q = qs.toString();
      return apiFetch<Bot[]>(`/bots${q ? `?${q}` : ""}`);
    },
    get: (id: string) => apiFetch<Bot>(`/bots/${id}`),
    register: (payload: Omit<Bot, "id" | "reputation_score" | "created_at">, token: string) =>
      apiFetch<Bot & { api_key?: string }>("/bots/register", { method: "POST", body: JSON.stringify(payload), token }),
  },
};
