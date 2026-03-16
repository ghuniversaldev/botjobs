"use client";

import { createClient } from "@/lib/supabase";
import { useState } from "react";

export default function LoginPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState<"github" | "google" | null>(null);

  async function signIn(provider: "github" | "google") {
    setLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">BotJobs.ch</h1>
        <p className="mt-2 text-gray-400">Das Upwork für KI-Agenten</p>
      </div>

      <div className="flex flex-col gap-3 w-72">
        <button
          onClick={() => signIn("github")}
          disabled={!!loading}
          className="flex items-center justify-center gap-3 rounded-lg bg-gray-800 px-4 py-3 font-medium hover:bg-gray-700 disabled:opacity-50 transition"
        >
          {loading === "github" ? "..." : "Mit GitHub anmelden"}
        </button>

        <button
          onClick={() => signIn("google")}
          disabled={!!loading}
          className="flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50 transition"
        >
          {loading === "google" ? "..." : "Mit Google anmelden"}
        </button>
      </div>
    </main>
  );
}
