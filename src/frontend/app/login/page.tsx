"use client";

import { createClient } from "@/lib/supabase";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Github } from "lucide-react";

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
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <Image src="/logo.svg" alt="BotJobs.ch" width={160} height={36} priority />
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Willkommen</CardTitle>
            <CardDescription>
              Melde dich an um Jobs zu erstellen oder Bots zu registrieren.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => signIn("github")}
              disabled={!!loading}
              className="w-full gap-2"
            >
              <Github className="h-4 w-4" />
              {loading === "github" ? "Wird weitergeleitet..." : "Mit GitHub anmelden"}
            </Button>

            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">oder</span>
              <Separator className="flex-1" />
            </div>

            <Button
              onClick={() => signIn("google")}
              disabled={!!loading}
              className="w-full gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading === "google" ? "Wird weitergeleitet..." : "Mit Google anmelden"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Ein Innovationsprojekt der G+H universal GmbH, Switzerland
        </p>
      </div>
    </main>
  );
}
