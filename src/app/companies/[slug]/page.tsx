import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { METRIC_TEMPLATES } from "@/lib/metrics";
import { TrendChart } from "@/components/trend-chart";
import { UpdateCard } from "@/components/update-card";

export default async function CompanyProfilePage({ params }: { params: { slug: string } }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const company = await prisma.company.findUnique({
    where: { slug: params.slug },
    include: {
      weeklyUpdates: {
        include: {
          _count: { select: { comments: true, reactions: true } },
          company: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { submittedAt: "desc" },
        take: 20,
      },
      monthlyScores: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take: 12,
      },
    },
  });

  if (!company) notFound();

  // Build trend data from updates
  const trendData = METRIC_TEMPLATES.map((template) => ({
    key: template.key,
    label: template.label,
    unit: template.unit,
    data: company.weeklyUpdates
      .slice()
      .reverse()
      .map((u) => {
        const metrics = JSON.parse(u.metrics);
        return {
          week: `W${u.weekNumber}`,
          value: metrics[template.key] ?? null,
        };
      }),
  }));

  const chartColors = ["#1e40af", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-base">
            {company.name.charAt(0)}
          </div>
          <div>
            <h1 className="page-title">{company.name}</h1>
            <p className="page-subtitle">{company.weeklyUpdates.length} updates submitted{company.teamSize ? ` · ${company.teamSize} employees` : ""}</p>
          </div>
        </div>
      </div>

      {/* Company Profile */}
      {(company.description || company.techStack || company.products || company.challenges || company.goals) && (
        <div className="card divide-y divide-slate-100">
          {company.description && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">About</p>
              <p className="text-sm text-slate-700 leading-relaxed">{company.description}</p>
            </div>
          )}
          {company.products && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Products & Services</p>
              <p className="text-sm text-slate-700 leading-relaxed">{company.products}</p>
            </div>
          )}
          {company.techStack && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Tech Stack</p>
              <p className="text-sm text-slate-700 leading-relaxed">{company.techStack}</p>
            </div>
          )}
          {company.challenges && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Challenges</p>
              <p className="text-sm text-slate-700 leading-relaxed">{company.challenges}</p>
            </div>
          )}
          {company.goals && (
            <div className="px-6 py-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Transformation Goals</p>
              <p className="text-sm text-slate-700 leading-relaxed">{company.goals}</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Ranking */}
      {company.monthlyScores.length > 0 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Monthly Rankings</h2>
          <div className="flex gap-3 overflow-x-auto">
            {company.monthlyScores.map((score) => (
              <div key={score.id} className="bg-slate-50 rounded-lg px-4 py-3 min-w-fit">
                <p className="text-xs text-slate-500">{score.month}/{score.year}</p>
                <p className="text-lg font-bold text-slate-900">#{score.rank}</p>
                <p className="text-xs text-slate-400">Score: {score.aggregatedScore}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Charts */}
      {company.weeklyUpdates.length > 1 && (
        <div className="card p-6">
          <h2 className="section-title mb-4">Metric Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {trendData.map((trend, i) => (
              <div key={trend.key} className={i === trendData.length - 1 && trendData.length % 3 === 1 ? "md:col-span-2 xl:col-span-1" : ""}>
                <TrendChart
                  data={trend.data}
                  label={trend.label}
                  unit={trend.unit}
                  color={chartColors[i]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Update History */}
      <div>
        <h2 className="section-title mb-4">Update History</h2>
        {company.weeklyUpdates.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No Updates Yet</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">This company has not submitted any weekly updates yet. Updates will appear here once they start reporting their progress.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {company.weeklyUpdates.map((update) => (
              <UpdateCard
                key={update.id}
                update={{
                  ...update,
                  submittedAt: update.submittedAt.toISOString(),
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
