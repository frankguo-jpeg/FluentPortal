"use client";

import Link from "next/link";
import { METRIC_TEMPLATES } from "@/lib/metrics";
import { formatWeekLabel } from "@/lib/utils";

interface UpdateCardProps {
  update: {
    id: string;
    weekNumber: number;
    year: number;
    metrics: string;
    details: string;
    submittedAt: string;
    company: { id: string; name: string; slug: string };
    _count: { comments: number; reactions: number };
  };
}

export function UpdateCard({ update }: UpdateCardProps) {
  const metrics = JSON.parse(update.metrics);

  return (
    <Link href={`/updates/${update.id}`} className="card-hover p-6 block group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">
            {update.company.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{update.company.name}</h3>
            <p className="text-xs text-slate-400">
              {formatWeekLabel(update.weekNumber, update.year)}
            </p>
          </div>
        </div>
        <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {METRIC_TEMPLATES.map((template) => {
          const value = metrics[template.key];
          if (value === null || value === undefined) return null;
          return (
            <div key={template.key} className="metric-card">
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{template.label}</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {value}<span className="text-xs font-normal text-slate-400">{template.unit === "%" ? "%" : ` ${template.unit}`}</span>
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{update.details}</p>

      <div className="flex gap-4 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z" />
          </svg>
          {update._count.comments}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m7.594-6.052a9.04 9.04 0 0 0-2.298 0" />
          </svg>
          {update._count.reactions}
        </span>
      </div>
    </Link>
  );
}
