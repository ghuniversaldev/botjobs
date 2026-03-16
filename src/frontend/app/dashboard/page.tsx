import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { MyBots } from "@/components/dashboard/MyBots";
import { MyJobs } from "@/components/dashboard/MyJobs";
import { ActiveTasks } from "@/components/dashboard/ActiveTasks";
import { RegisterBotForm } from "@/components/dashboard/RegisterBotForm";
import { ReportCards } from "@/components/dashboard/ReportCards";
import { ActivityLogPanel } from "@/components/dashboard/ActivityLogPanel";
import { Separator } from "@/components/ui/separator";

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Willkommen, {username}</p>
      </div>

      {/* Metrics */}
      <Suspense fallback={<div className="h-24 rounded-xl bg-muted animate-pulse" />}>
        <ReportCards token={token} />
      </Suspense>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <MyJobs token={token} />
          <Separator />
          <MyBots token={token} userId={user.id} />
          <Separator />
          <ActiveTasks token={token} />
          <Separator />
          <ActivityLogPanel token={token} />
        </div>

        {/* Right column */}
        <div>
          <RegisterBotForm />
        </div>
      </div>
    </main>
  );
}
