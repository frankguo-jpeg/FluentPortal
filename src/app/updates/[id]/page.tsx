import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { METRIC_TEMPLATES } from "@/lib/metrics";
import { formatWeekLabel } from "@/lib/utils";
import { ReactionBar } from "@/components/reaction-bar";
import { CommentSection } from "@/components/comment-section";
import { UpdateActions } from "@/components/update-actions";
import Link from "next/link";

export default async function UpdateDetailPage({ params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const update = await prisma.weeklyUpdate.findUnique({
    where: { id: params.id },
    include: {
      company: { select: { id: true, name: true, slug: true } },
      attachments: { select: { id: true, filename: true, size: true, mimeType: true } },
    },
  });

  if (!update) notFound();

  const metrics = JSON.parse(update.metrics);
  const canManage = session.user.role === "COMPANY_ADMIN" && session.user.companyId === update.companyId;

  return (
    <div className="max-w-3xl animate-fade-in">
      <Link href="/updates" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to updates
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm">
              {update.company.name.charAt(0)}
            </div>
            <div>
              <h1 className="page-title">{update.company.name}</h1>
              <p className="text-sm text-slate-400">{formatWeekLabel(update.weekNumber, update.year)}</p>
            </div>
          </div>
          {canManage && <UpdateActions updateId={update.id} />}
        </div>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Metrics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

      <div className="card p-6 mb-6">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Details</h2>
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{update.details}</p>
      </div>

      {update.attachments.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Attachments</h2>
          <div className="space-y-2">
            {update.attachments.map((att) => (
              <div key={att.id} className="flex items-center gap-3">
                <a href={`/api/attachments/${att.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                  {att.mimeType.startsWith("image/") ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v13.5a1.5 1.5 0 0 0 1.5 1.5Z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                  )}
                  {att.filename}
                </a>
                <span className="text-xs text-slate-400">({(att.size / 1024).toFixed(0)}KB)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-6 mb-6">
        <ReactionBar updateId={update.id} />
      </div>

      <div className="card p-6">
        <CommentSection updateId={update.id} />
      </div>
    </div>
  );
}
