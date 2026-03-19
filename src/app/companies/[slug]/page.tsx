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
        <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
        <p className="text-slate-500 text-sm">{company.weeklyUpdates.length} updates submitted</p>
      </div>

      {/* Monthly Ranking */}
      {company.monthlyScores.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-3">Monthly Rankings</h2>
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
          <h2 className="font-semibold text-slate-900 mb-4">Metric Trends</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trendData.map((trend, i) => (
              <TrendChart
                key={trend.key}
                data={trend.data}
                label={trend.label}
                unit={trend.unit}
                color={chartColors[i]}
              />
            ))}
          </div>
        </div>
      )}

      {/* Update History */}
      <div>
        <h2 className="font-semibold text-slate-900 mb-4">Update History</h2>
        {company.weeklyUpdates.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500">No updates yet.</p>
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
