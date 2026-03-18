import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const scores = await prisma.monthlyScore.findMany({
    where: { month, year },
    include: { company: { select: { id: true, name: true, slug: true } } },
    orderBy: { rank: "asc" },
  });

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevScores = await prisma.monthlyScore.findMany({
    where: { month: prevMonth, year: prevYear },
  });
  const prevRankMap = new Map(prevScores.map((s) => [s.companyId, s.rank]));

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">{monthNames[month - 1]} {year}</p>
      </div>

      <div className="card p-5 bg-gradient-to-r from-amber-50 to-yellow-50/50 border-amber-100/50 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl">🏆</div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Monthly Cash Prize</p>
            <p className="text-xs text-amber-700/70">The most quantifiably progressed company each month wins a cash prize!</p>
          </div>
        </div>
      </div>

      {scores.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.02 6.02 0 0 1-2.77.702 6.02 6.02 0 0 1-2.77-.702" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No monthly scores yet.</p>
          <p className="text-xs text-slate-400 mt-1">Scores are computed from weekly AI rankings.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Rank</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Company</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Score</th>
                <th className="text-left px-6 py-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, i) => {
                const prevRank = prevRankMap.get(score.companyId);
                const trend = prevRank ? prevRank - score.rank : 0;

                return (
                  <tr key={score.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {i < 3 ? (
                        <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                      ) : (
                        <span className="text-sm font-medium text-slate-400">#{score.rank}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{score.company.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, score.aggregatedScore)}%` }} />
                        </div>
                        <span className="text-sm text-slate-600">{score.aggregatedScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {trend > 0 && <span className="text-emerald-600 font-medium flex items-center gap-0.5"><svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd"/></svg>{trend}</span>}
                      {trend < 0 && <span className="text-red-500 font-medium flex items-center gap-0.5"><svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd"/></svg>{Math.abs(trend)}</span>}
                      {trend === 0 && <span className="text-slate-300">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
