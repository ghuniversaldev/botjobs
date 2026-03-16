import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { MyBots } from "@/components/dashboard/MyBots";
import { ActiveTasks } from "@/components/dashboard/ActiveTasks";
import { RegisterBotForm } from "@/components/dashboard/RegisterBotForm";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const token = (await supabase.auth.getSession()).data.session?.access_token ?? "";
  const username = (user.user_metadata?.preferred_username as string) ?? user.email ?? "User";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Willkommen, {username}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-8">
          <MyBots token={token} userId={user.id} />
          <Separator />
          <ActiveTasks token={token} />
        </div>
        <div>
          <RegisterBotForm token={token} />
        </div>
      </div>
    </main>
  );
}
