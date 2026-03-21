import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentWeek, formatWeekLabel } from "@/lib/utils";
import Link from "next/link";

const RANK_MEDALS = ["🥇", "🥈", "🥉"];
const RANK_GRADIENTS = [
  "from-amber-500/10 via-yellow-500/5 to-transparent border-amber-200/40",
  "from-slate-400/10 via-gray-300/5 to-transparent border-slate-200/40",
  "from-orange-500/10 via-amber-400/5 to-transparent border-orange-200/40",
];

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { weekNumber, year } = getCurrentWeek();

  const latestRanking = await prisma.aIRanking.findFirst({
    orderBy: { generatedAt: "desc" },
  });

  let top3: Array<{ companyId: string; companyName: string; rank: number; score: number; reasoning: string }> = [];
  let suggestion: string | null = null;

  if (latestRanking) {
    const allRankings = JSON.parse(latestRanking.rankings);
    top3 = allRankings.filter((r: { rank: number }) => r.rank <= 3);

    if (session.user.role === "COMPANY_ADMIN" && session.user.companyId) {
      const suggestions = JSON.parse(latestRanking.suggestions);
      suggestion = suggestions[session.user.companyId] || null;
    }
  }

  let hasSubmitted = false;
  if (session.user.companyId) {
    const existing = await prisma.weeklyUpdate.findUnique({
      where: {
        companyId_weekNumber_year: {
          companyId: session.user.companyId,
          weekNumber,
          year,
        },
      },
    });
    hasSubmitted = !!existing;
  }

  // Get some stats
  const totalUpdates = await prisma.weeklyUpdate.count();
  const totalCompanies = await prisma.company.count();
  const thisWeekUpdates = await prisma.weeklyUpdate.count({ where: { weekNumber, year } });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">{formatWeekLabel(weekNumber, year)}</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">This Week</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{thisWeekUpdates}<span className="text-sm font-normal text-slate-400">/{totalCompanies}</span></p>
          <p className="text-xs text-slate-500 mt-1">updates submitted</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Updates</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalUpdates}</p>
          <p className="text-xs text-slate-500 mt-1">across all companies</p>
        </div>
        <div className="card p-6">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Portfolio</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCompanies}</p>
          <p className="text-xs text-slate-500 mt-1">companies tracked</p>
        </div>
      </div>

      {/* Submission Status */}
      {session.user.role === "COMPANY_ADMIN" && (
        <div className={`card p-6 border-l-4 ${hasSubmitted ? "border-l-emerald-500 bg-emerald-50/30" : "border-l-amber-500 bg-amber-50/30"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasSubmitted ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                {hasSubmitted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">
                  {hasSubmitted ? "Update Submitted" : "Update Pending"}
                </h3>
                <p className="text-sm text-slate-500">
                  {hasSubmitted
                    ? "Your weekly update is in. Rankings will be generated soon."
                    : "Submit your weekly progress update to be included in rankings."}
                </p>
              </div>
            </div>
            {!hasSubmitted && (
              <Link href="/updates/new" className="btn-primary whitespace-nowrap">
                Submit Now
              </Link>
            )}
          </div>
        </div>
      )}

      {/* AI Suggestion */}
      {suggestion && (
        <div className="card p-6 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-blue-100/50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-blue-950 text-sm">AI Improvement Suggestion</h3>
              <p className="text-sm text-blue-800/80 mt-1 leading-relaxed">{suggestion}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Rankings */}
      <div>
        <h2 className="section-title mb-4">
          {top3.length > 0 ? `Top Performers — Week ${latestRanking?.weekNumber}` : "Weekly Rankings"}
        </h2>
        {top3.length > 0 ? (
          <div className="grid gap-3">
            {top3.map((entry, i) => (
              <div key={entry.companyId} className={`card p-6 bg-gradient-to-r ${RANK_GRADIENTS[i]}`}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl">{RANK_MEDALS[i]}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">{entry.companyName}</h3>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-20 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${entry.score}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-500">{entry.score}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{entry.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.02 6.02 0 0 1-2.77.702 6.02 6.02 0 0 1-2.77-.702" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No Rankings Yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">Rankings are generated automatically after companies submit their weekly progress updates. The top 3 performers will be highlighted here.</p>
            <Link href="/chat" className="btn-primary inline-flex items-center gap-2 mt-5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Submit your first update
            </Link>
          </div>
        )}
      </div>

      {/* Insight of the Week */}
      {latestRanking?.insightOfWeek && (
        <div className="card p-6 text-white border-0" style={{ background: "linear-gradient(135deg, #1a2332 0%, #2d4a6a 100%)" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-white/90 text-sm uppercase tracking-wide">Insight of the Week</h2>
              <p className="text-white/80 mt-2 leading-relaxed">{latestRanking.insightOfWeek}</p>
              {latestRanking.insightUpdateId && (
                <Link
                  href={`/updates/${latestRanking.insightUpdateId}`}
                  className="inline-flex items-center gap-1 mt-3 text-xs text-white/60 hover:text-white transition-colors font-medium"
                >
                  View full update
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
