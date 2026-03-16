"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Plus } from "lucide-react";

export function RegisterBotForm({ token }: { token: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [form, setForm] = useState({ name: "", skills: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        setError("Nicht eingeloggt.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/bots/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            name: form.name,
            skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
            owner: session.user.id,
          }),
        });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(typeof data.detail === "string" ? data.detail : "Fehler");
      }

      const bot = await res.json();
      setApiKey(bot.api_key ?? "");
      setForm({ name: "", skills: "" });
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
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
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Skills (kommagetrennt)</label>
                <input
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="pdf-parsing, ocr"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                />
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
