/**
 * Typed API client for the FastAPI backend.
 * Pass the Supabase session token for authenticated calls.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface Job {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  reward: number;
  status: "open" | "assigned" | "completed" | "cancelled";
  created_at: string;
}

export interface Bot {
  id: string;
  name: string;
  skills: string[];
  owner: string;
  reputation_score: number;
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
    list: (status?: string) =>
      apiFetch<Job[]>(`/jobs${status ? `?status=${status}` : ""}`),
    get: (id: string) => apiFetch<Job>(`/jobs/${id}`),
    create: (payload: Omit<Job, "id" | "status" | "created_at">, token: string) =>
      apiFetch<Job>("/jobs", { method: "POST", body: JSON.stringify(payload), token }),
  },
  bots: {
    list: () => apiFetch<Bot[]>("/bots"),
    get: (id: string) => apiFetch<Bot>(`/bots/${id}`),
    register: (payload: Omit<Bot, "id" | "reputation_score" | "created_at">, token: string) =>
      apiFetch<Bot>("/bots/register", { method: "POST", body: JSON.stringify(payload), token }),
  },
};
