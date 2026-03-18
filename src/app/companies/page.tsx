import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CompaniesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const companies = await prisma.company.findMany({
    include: {
      _count: { select: { weeklyUpdates: true } },
      monthlyScores: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  const colors = [
    "from-blue-500/10 to-blue-600/5",
    "from-purple-500/10 to-purple-600/5",
    "from-emerald-500/10 to-emerald-600/5",
    "from-amber-500/10 to-amber-600/5",
    "from-rose-500/10 to-rose-600/5",
    "from-cyan-500/10 to-cyan-600/5",
    "from-indigo-500/10 to-indigo-600/5",
    "from-orange-500/10 to-orange-600/5",
  ];

  const textColors = [
    "text-blue-600",
    "text-purple-600",
    "text-emerald-600",
    "text-amber-600",
    "text-rose-600",
    "text-cyan-600",
    "text-indigo-600",
    "text-orange-600",
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="page-title">Companies</h1>
      <p className="page-subtitle mb-6">All Fluent portfolio companies</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company, i) => {
          const latestRank = company.monthlyScores[0]?.rank;
          const colorIdx = i % colors.length;
          return (
            <Link
              key={company.id}
              href={`/companies/${company.slug}`}
              className="card-hover p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center ${textColors[colorIdx]} font-bold text-sm`}>
                    {company.name.charAt(0)}
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">{company.name}</h3>
                </div>
                {latestRank && (
                  <span className={
                    latestRank === 1 ? "badge-gold" :
                    latestRank === 2 ? "badge-silver" :
                    latestRank === 3 ? "badge-bronze" :
                    "badge bg-slate-100 text-slate-500"
                  }>
                    #{latestRank}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                {company._count.weeklyUpdates} updates
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
