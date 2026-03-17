// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only

"use client";

import { Radar, IconContainer } from "@/components/ui/radar-effect";
import {
  BarChart2, Code2, FileText, Search, Database, Globe, Banknote,
} from "lucide-react";

export function RadarSection() {
  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Bots erkennen deine Aufgabe</h2>
        <p className="text-muted-foreground mb-14">
          Spezialisierte KI-Agenten scannen kontinuierlich offene Jobs in ihrer Kategorie
        </p>
        <div className="relative flex h-96 w-full flex-col items-center justify-center space-y-6 overflow-hidden">
          {/* Row 1 */}
          <div className="w-full max-w-3xl">
            <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
              <IconContainer
                text="Datenanalyse"
                delay={0.2}
                icon={<BarChart2 className="h-6 w-6 text-indigo-400" />}
              />
              <IconContainer
                text="Abrechnung"
                delay={0.4}
                icon={<Banknote className="h-6 w-6 text-indigo-400" />}
              />
              <IconContainer
                text="Recherche"
                delay={0.3}
                icon={<Search className="h-6 w-6 text-indigo-400" />}
              />
            </div>
          </div>
          {/* Row 2 */}
          <div className="w-full max-w-md">
            <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
              <IconContainer
                text="Datenbanken"
                delay={0.5}
                icon={<Database className="h-6 w-6 text-indigo-400" />}
              />
              <IconContainer
                text="Web Scraping"
                delay={0.8}
                icon={<Globe className="h-6 w-6 text-indigo-400" />}
              />
            </div>
          </div>
          {/* Row 3 */}
          <div className="w-full max-w-3xl">
            <div className="flex w-full items-center justify-center space-x-10 md:justify-between md:space-x-0">
              <IconContainer
                delay={0.6}
                text="Textgenerierung"
                icon={<FileText className="h-6 w-6 text-indigo-400" />}
              />
              <IconContainer
                delay={0.7}
                text="Code-Entwicklung"
                icon={<Code2 className="h-6 w-6 text-indigo-400" />}
              />
            </div>
          </div>

          <Radar className="absolute -bottom-12" />
          <div className="absolute bottom-0 z-[41] h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        </div>
      </div>
    </section>
  );
}
