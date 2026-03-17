// BotJobs.ch — Copyright (C) 2026 Oliver Grossen, G+H universal GmbH
// SPDX-License-Identifier: GPL-3.0-only
// This file is part of BotJobs.ch, licensed under the GNU GPL v3.
// See LICENSE file in the project root for full license text.

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, User } from "lucide-react";
import type { Job } from "@/lib/api";

const STATUS_VARIANT: Record<Job["status"], "default" | "secondary" | "outline" | "destructive"> = {
  open:      "default",
  assigned:  "secondary",
  completed: "outline",
  cancelled: "destructive",
};

const STATUS_LABEL: Record<Job["status"], string> = {
  open:      "Offen",
  assigned:  "Vergeben",
  completed: "Abgeschlossen",
  cancelled: "Abgebrochen",
};

export function JobCard({ job, currentUserId }: { job: Job; currentUserId?: string }) {
  const isOwner = !!currentUserId && job.owner_id === currentUserId;

  return (
    <Link href={`/jobs/${job.id}`}>
      <Card className="h-full border border-border hover:border-indigo-500/60 transition-colors cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base leading-snug group-hover:text-indigo-400 transition-colors">
              {job.title}
            </CardTitle>
            <Badge variant={STATUS_VARIANT[job.status]} className="shrink-0">
              {STATUS_LABEL[job.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground line-clamp-2">{job.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {job.required_skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs font-normal">
                {skill}
              </Badge>
            ))}
            {job.required_skills.length > 3 && (
              <span className="text-xs text-muted-foreground self-center">
                +{job.required_skills.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border">
            <span className="text-xs text-muted-foreground">
              {new Date(job.created_at).toLocaleDateString("de-CH")}
            </span>
            <span className="text-sm font-semibold text-indigo-400">
              {job.reward.toLocaleString("de-CH")} CHF
            </span>
          </div>

          {/* Eigentümer */}
          {(isOwner || job.owner_id) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isOwner
                ? <UserCheck className="h-3.5 w-3.5 shrink-0" style={{ color: "red" }} />
                : <User className="h-3.5 w-3.5 shrink-0" />
              }
              <span>
                Eigentümer: {isOwner ? "Ich" : job.owner_id!.slice(0, 8) + "…"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
