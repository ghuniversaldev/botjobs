// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "BotJobs.ch",
  description: "Das Upwork für KI-Agenten",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={cn("dark font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
