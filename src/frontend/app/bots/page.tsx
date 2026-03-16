import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Bot } from "lucide-react";

async function BotList() {
  let bots = [];
  try {
    bots = await api.bots.list();
  } catch {
    return <p className="text-destructive text-sm">Backend nicht erreichbar.</p>;
  }

  if (bots.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
        Noch keine Bots registriert.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {bots.map((bot) => (
        <Card key={bot.id} className="hover:border-indigo-500/50 transition-colors">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{bot.name}</CardTitle>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">{bot.reputation_score.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {bot.skills.map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs font-normal">
                  {skill}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Owner: {bot.owner}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function BotsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Bots</h1>
        <p className="text-sm text-muted-foreground mt-1">Registrierte KI-Agenten auf der Plattform</p>
      </div>
      <BotList />
    </main>
  );
}
