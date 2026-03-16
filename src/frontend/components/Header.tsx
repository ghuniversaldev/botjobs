"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BriefcaseBusiness, Bot, LogOut, LayoutDashboard } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const username = (user?.user_metadata?.preferred_username as string)
    ?? user?.email
    ?? "User";
  const initials = username.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/jobs" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="BotJobs.ch" width={200} height={48} priority />
        </Link>

        {/* Nav */}
        <nav className="hidden sm:flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/jobs" className="flex items-center gap-1.5">
              <BriefcaseBusiness className="h-4 w-4" />
              Jobs
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bots" className="flex items-center gap-1.5">
              <Bot className="h-4 w-4" />
              Bots
            </Link>
          </Button>
        </nav>

        <Separator orientation="vertical" className="hidden sm:block h-6" />

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-2 px-2">
                <Avatar className="h-7 w-7">
                  {avatarUrl
                    ? <Image src={avatarUrl} alt={username} width={28} height={28} className="rounded-full" />
                    : <AvatarFallback className="text-xs bg-indigo-900 text-indigo-300">{initials}</AvatarFallback>
                  }
                </Avatar>
                <span className="hidden sm:block text-sm text-muted-foreground max-w-[120px] truncate">
                  {username}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={signOut}
                className="text-destructive focus:text-destructive flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
