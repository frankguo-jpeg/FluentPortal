"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function NavUser() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold" style={{ background: "rgba(74, 144, 217, 0.15)", color: "#6ba3d6" }}>
          {session.user.name?.charAt(0) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
          <p className="text-[11px] truncate" style={{ color: "rgba(148, 177, 215, 0.5)" }}>{session.user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium" style={{ background: "rgba(74, 144, 217, 0.15)", color: "#6ba3d6" }}>
          {session.user.role === "MANAGER" ? "Manager" : "Company Admin"}
        </span>
        {session.user.role === "MANAGER" && (
          <Link href="/manager" className="text-[10px] font-medium transition-colors" style={{ color: "#4a90d9" }}>
            Panel
          </Link>
        )}
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 text-xs transition-colors hover:text-slate-300"
        style={{ color: "rgba(148, 177, 215, 0.35)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
        </svg>
        Sign out
      </button>
    </div>
  );
}
