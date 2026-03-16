import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <LayoutDashboard className="h-6 w-6 text-indigo-400" />
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Deine Aktivitäten auf einen Blick</p>
        </div>
      </div>
      <div className="rounded-xl border border-dashed border-border p-16 text-center text-muted-foreground">
        Dashboard — kommt bald.
      </div>
    </main>
  );
}
