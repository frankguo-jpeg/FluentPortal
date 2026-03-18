import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UpdateCard } from "@/components/update-card";
import Link from "next/link";

export default async function UpdatesPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const updates = await prisma.weeklyUpdate.findMany({
    include: {
      company: { select: { id: true, name: true, slug: true } },
      _count: { select: { comments: true, reactions: true } },
    },
    orderBy: { submittedAt: "desc" },
    take: 50,
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Weekly Updates</h1>
          <p className="page-subtitle">Browse progress updates from all portfolio companies</p>
        </div>
        {session.user.role === "COMPANY_ADMIN" && (
          <Link href="/updates/new" className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Submit Update
          </Link>
        )}
      </div>

      {updates.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <p className="text-slate-500">No updates yet.</p>
          <p className="text-xs text-slate-400 mt-1">Be the first to submit a weekly update!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {updates.map((update) => (
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
  );
}
