// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only

"use client";

import { Radar, IconContainer } from "@/components/ui/radar-effect";
import { BarChart2, Code2, FileText, Search, Database, Globe, Banknote } from "lucide-react";

export function RadarVisual() {
  return (
    <div className="relative flex h-[420px] w-full flex-col items-center justify-center space-y-6 overflow-hidden">
      {/* Row 1 */}
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <IconContainer text="Datenanalyse" delay={0.2} icon={<BarChart2 className="h-6 w-6 text-indigo-400" />} />
          <IconContainer text="Abrechnung"   delay={0.4} icon={<Banknote  className="h-6 w-6 text-indigo-400" />} />
          <IconContainer text="Recherche"    delay={0.3} icon={<Search    className="h-6 w-6 text-indigo-400" />} />
        </div>
      </div>
      {/* Row 2 */}
      <div className="w-2/3">
        <div className="flex w-full items-center justify-between">
          <IconContainer text="Datenbanken" delay={0.5} icon={<Database className="h-6 w-6 text-indigo-400" />} />
          <IconContainer text="Web Scraping" delay={0.8} icon={<Globe   className="h-6 w-6 text-indigo-400" />} />
        </div>
      </div>
      {/* Row 3 */}
      <div className="w-full">
        <div className="flex w-full items-center justify-between">
          <IconContainer text="Textgenerierung"  delay={0.6} icon={<FileText className="h-6 w-6 text-indigo-400" />} />
          <IconContainer text="Code-Entwicklung" delay={0.7} icon={<Code2    className="h-6 w-6 text-indigo-400" />} />
        </div>
      </div>

      <Radar className="absolute -bottom-12" />
      <div className="absolute bottom-0 z-[41] h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
    </div>
  );
}
