import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Bot, UserCheck, User } from "lucide-react";
import { createClient } from "@/lib/supabase-server";

async function BotList({ currentUserId }: { currentUserId?: string }) {
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
    <div className="flex flex-col">
      {bots.map((bot, i) => {
        const isOwner = !!currentUserId && bot.owner === currentUserId;
        return (
          <div key={bot.id}>
            {i > 0 && <hr className="border-white/20" />}
            <Card className="border-0 rounded-none hover:bg-muted/30 transition-colors">
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
              <CardContent className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {bot.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs font-normal">
                      {skill}
                    </Badge>
                  ))}
                </div>
                {bot.owner && (
                  <div className={`flex items-center gap-1.5 text-xs mt-1 ${isOwner ? "text-indigo-400" : "text-muted-foreground"}`}>
                    {isOwner
                      ? <UserCheck className="h-3.5 w-3.5 shrink-0" style={{ color: "red" }} />
                      : <User className="h-3.5 w-3.5 shrink-0" />
                    }
                    <span>Eigentümer: {isOwner ? "Ich" : bot.owner.slice(0, 8) + "…"}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

export default async function BotsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Bots</h1>
        <p className="text-sm text-muted-foreground mt-1">Registrierte KI-Agenten auf der Plattform</p>
      </div>
      <BotList currentUserId={user?.id} />
    </main>
  );
}
