import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCurrentWeek, formatWeekLabel } from "@/lib/utils";
import { ManagerActions } from "@/components/manager-actions";

export default async function ManagerPage() {
  const session = await getSession();
  if (!session || session.user.role !== "MANAGER") redirect("/");

  const { weekNumber, year } = getCurrentWeek();

  const companies = await prisma.company.findMany({
    include: {
      weeklyUpdates: {
        where: { weekNumber, year },
        select: { id: true, submittedAt: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const latestRanking = await prisma.aIRanking.findFirst({
    orderBy: { generatedAt: "desc" },
  });

  let fullRankings: Array<{ companyId: string; companyName: string; rank: number; score: number; reasoning: string }> = [];
  let allSuggestions: Record<string, string> = {};

  if (latestRanking) {
    fullRankings = JSON.parse(latestRanking.rankings);
    allSuggestions = JSON.parse(latestRanking.suggestions);
  }

  const submittedCount = companies.filter((c) => c.weeklyUpdates.length > 0).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h1 className="page-title">Manager Panel</h1>
        <p className="page-subtitle">{formatWeekLabel(weekNumber, year)}</p>
      </div>

      <ManagerActions weekNumber={weekNumber} year={year} />

      {/* Submission Compliance */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Submission Status</h2>
          <span className="badge bg-slate-100 text-slate-600">{submittedCount}/{companies.length}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {companies.map((company) => {
            const submitted = company.weeklyUpdates.length > 0;
            return (
              <div
                key={company.id}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium flex items-center gap-2 ${
                  submitted
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {submitted ? (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="truncate">{company.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Rankings */}
      {fullRankings.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">
            Full Rankings — Week {latestRanking?.weekNumber}
          </h2>
          <div className="space-y-3">
            {fullRankings.map((entry, i) => (
              <div key={entry.companyId} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {i < 3 ? (
                      <span className="text-xl">{["🥇", "🥈", "🥉"][i]}</span>
                    ) : (
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {entry.rank}
                      </span>
                    )}
                    <span className="font-semibold text-slate-900">{entry.companyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${entry.score}%` }} />
                    </div>
                    <span className="text-xs font-medium text-slate-500 w-8">{entry.score}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 pl-10">{entry.reasoning}</p>
                {allSuggestions[entry.companyId] && (
                  <div className="bg-blue-50 rounded-xl p-3 mt-3 ml-10">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
                      </svg>
                      <p className="text-xs text-blue-800">{allSuggestions[entry.companyId]}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
