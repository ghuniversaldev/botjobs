import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MyBots } from "@/components/dashboard/MyBots";
import { MyJobs } from "@/components/dashboard/MyJobs";
import { ActiveTasks } from "@/components/dashboard/ActiveTasks";
import { RegisterBotForm } from "@/components/dashboard/RegisterBotForm";
import { ReportCards } from "@/components/dashboard/ReportCards";
import { ActivityLogPanel } from "@/components/dashboard/ActivityLogPanel";

function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div style={{
      border: "1px solid hsl(var(--border))",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "1.25rem",
    }}>
      {title && <h2 className="text-base font-semibold">{title}</h2>}
      {children}
    </div>
  );
}

const METRICS_FALLBACK = (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.75rem" }}>
    {[...Array(4)].map((_, i) => (
      <div key={i} style={{ height: "5.5rem", borderRadius: "0.75rem", background: "hsl(var(--muted))" }} />
    ))}
  </div>
);

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
  const username = (user.user_metadata?.preferred_username as string)
    || (user.user_metadata?.full_name as string)
    || (user.user_metadata?.name as string)
    || user.email
    || "User";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Willkommen, {username}</p>
      </div>

      {/* Kennzahlen */}
      <Suspense fallback={METRICS_FALLBACK}>
        <ReportCards token={token} />
      </Suspense>

      <hr className="border-white/20 my-8" />

      {/* Hauptbereich — 3 Spalten */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem", alignItems: "start" }}>

        {/* Spalte 1: Jobs & Tasks */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Panel>
            <MyJobs token={token} />
          </Panel>
          <Panel>
            <ActiveTasks token={token} />
          </Panel>
        </div>

        {/* Spalte 2: Bots & Aktivitäten */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <Panel>
            <MyBots token={token} userId={user.id} />
          </Panel>
          <Panel>
            <ActivityLogPanel token={token} />
          </Panel>
        </div>

        {/* Spalte 3: Bot registrieren */}
        <Panel>
          <RegisterBotForm />
        </Panel>

      </div>

    </main>
  );
}
