import Link from "next/link";
import type { Job } from "@/lib/api";

const STATUS_STYLES: Record<Job["status"], string> = {
  open: "bg-green-900 text-green-300",
  assigned: "bg-yellow-900 text-yellow-300",
  completed: "bg-blue-900 text-blue-300",
  cancelled: "bg-gray-800 text-gray-400",
};

export function JobCard({ job }: { job: Job }) {
  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 hover:border-gray-600 transition cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-semibold text-white text-lg leading-tight">{job.title}</h3>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[job.status]}`}>
            {job.status}
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-400 line-clamp-2">{job.description}</p>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {job.required_skills.slice(0, 4).map((skill) => (
              <span key={skill} className="rounded-md bg-gray-800 px-2 py-0.5 text-xs text-gray-300">
                {skill}
              </span>
            ))}
            {job.required_skills.length > 4 && (
              <span className="text-xs text-gray-500">+{job.required_skills.length - 4}</span>
            )}
          </div>
          <span className="text-sm font-semibold text-indigo-400">
            {job.reward.toLocaleString("de-CH")} CHF
          </span>
        </div>
      </div>
    </Link>
  );
}
