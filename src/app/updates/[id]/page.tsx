import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { METRIC_TEMPLATES } from "@/lib/metrics";
import { formatWeekLabel } from "@/lib/utils";
import { ReactionBar } from "@/components/reaction-bar";
import { CommentSection } from "@/components/comment-section";
import Link from "next/link";

export default async function UpdateDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const update = await prisma.weeklyUpdate.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!update) notFound();

  const metrics = JSON.parse(update.metrics);

  return (
    <div className="max-w-3xl animate-fade-in">
      <Link href="/updates" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to updates
      </Link>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">
            {update.company.name.charAt(0)}
          </div>
          <div>
            <h1 className="page-title">{update.company.name}</h1>
            <p className="text-sm text-slate-400">{formatWeekLabel(update.weekNumber, update.year)}</p>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Metrics</h2>
        <div className="grid grid-cols-2 gap-3">
          {METRIC_TEMPLATES.map((template) => {
            const value = metrics[template.key];
            return (
              <div key={template.key} className="metric-card text-center py-5">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{template.label}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {value !== null && value !== undefined
                    ? <>{value}<span className="text-sm font-normal text-slate-400">{template.unit === "%" ? "%" : ` ${template.unit}`}</span></>
                    : <span className="text-slate-300">—</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-6 mb-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Details</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{update.details}</p>
      </div>

      <div className="card p-5 mb-4">
        <ReactionBar updateId={update.id} />
      </div>

      <div className="card p-6">
        <CommentSection updateId={update.id} />
      </div>
    </div>
  );
}
