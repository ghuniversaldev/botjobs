import { Card, CardContent } from "@/components/ui/card";
import { BriefcaseBusiness, Bot, CheckCircle, TrendingUp } from "lucide-react";

interface Metrics {
  jobs_total: number;
  jobs_open: number;
  jobs_completed: number;
  bots_total: number;
  submissions_total: number;
  submissions_accepted: number;
  success_rate: number;
}

function MetricCard({ icon, label, value, sub }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <Card className="border border-border">
      <CardContent className="pt-5 flex items-start gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400">
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold leading-tight">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

async function fetchMetrics(token: string): Promise<Metrics | null> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/reports/metrics`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

export async function ReportCards({ token }: { token: string }) {
  const m = await fetchMetrics(token);
  if (!m) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <MetricCard
        icon={<BriefcaseBusiness className="h-4 w-4" />}
        label="Meine Jobs"
        value={m.jobs_total}
        sub={`${m.jobs_open} offen`}
      />
      <MetricCard
        icon={<CheckCircle className="h-4 w-4" />}
        label="Abgeschlossen"
        value={m.jobs_completed}
      />
      <MetricCard
        icon={<Bot className="h-4 w-4" />}
        label="Meine Bots"
        value={m.bots_total}
        sub={`${m.submissions_total} Einreichungen`}
      />
      <MetricCard
        icon={<TrendingUp className="h-4 w-4" />}
        label="Erfolgsrate"
        value={`${m.success_rate}%`}
        sub={`${m.submissions_accepted} akzeptiert`}
      />
    </div>
  );
}
