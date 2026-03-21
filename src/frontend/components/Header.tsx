// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { BriefcaseBusiness, Bot, BookOpen, LayoutDashboard, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
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
  const username =
    (user?.user_metadata?.preferred_username as string) ||
    (user?.user_metadata?.full_name as string) ||
    (user?.user_metadata?.name as string) ||
    user?.email ||
    "User";
  const initials = username.slice(0, 2).toUpperCase();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/")
      ? "text-foreground"
      : "text-muted-foreground";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 gap-6">

        {/* Logo — links */}
        <Link href="/" className="shrink-0">
          <Image src="/logo.svg" alt="BotJobs.ch" width={220} height={44} priority unoptimized />
        </Link>

        {/* Nav — Mitte */}
        <nav className="hidden sm:flex items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/jobs" className={`flex items-center gap-1.5 ${isActive("/jobs")}`}>
              <BriefcaseBusiness className="h-4 w-4" />
              Jobs
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="ml-3" asChild>
            <Link href="/bots" className={`flex items-center gap-1.5 ${isActive("/bots")}`}>
              <Bot className="h-4 w-4" />
              Bots
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="ml-3" asChild>
            <Link href="/docs/guide" className={`flex items-center gap-1.5 ${isActive("/docs")}`}>
              <BookOpen className="h-4 w-4" />
              Docs
            </Link>
          </Button>
          {user && (
            <Button variant="ghost" size="sm" className="ml-3" asChild>
              <Link href="/dashboard" className={`flex items-center gap-1.5 ${isActive("/dashboard")}`}>
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          )}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Rechts — User oder Login */}
        {user ? (
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-muted transition-colors outline-none">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={username} width={20} height={20} className="w-5 h-5 rounded-full object-cover shrink-0" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-indigo-900 text-indigo-300 text-[9px] font-medium flex items-center justify-center shrink-0">{initials}</span>
                  )}
                  <span className="hidden sm:block text-xs text-muted-foreground max-w-[100px] truncate">
                    {username}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium truncate">{username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
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
          </div>
        ) : (
          <Button size="sm" asChild>
            <Link href="/login">Anmelden</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
