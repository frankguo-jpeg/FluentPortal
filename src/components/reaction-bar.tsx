"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const REACTION_TYPES = [
  { type: "LIKE", label: "Like", icon: "\ud83d\udc4d" },
  { type: "INSIGHTFUL", label: "Insightful", icon: "\ud83d\udca1" },
  { type: "INNOVATIVE", label: "Innovative", icon: "\ud83d\ude80" },
] as const;

interface ReactionBarProps {
  updateId: string;
}

export function ReactionBar({ updateId }: ReactionBarProps) {
  const [counts, setCounts] = useState({ LIKE: 0, INSIGHTFUL: 0, INNOVATIVE: 0 });
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [pendingTypes, setPendingTypes] = useState<Set<string>>(new Set());
  const prevStateRef = useRef<{ counts: typeof counts; userReactions: string[] } | null>(null);

  useEffect(() => {
    fetch(`/api/reactions?updateId=${updateId}`)
      .then((r) => r.json())
      .then((data) => {
        setCounts(data.counts);
        setUserReactions(data.userReactions);
      });
  }, [updateId]);

  async function toggleReaction(type: string) {
    if (pendingTypes.has(type)) return;

    // Save previous state for rollback
    const prevCounts = { ...counts };
    const prevUserReactions = [...userReactions];
    prevStateRef.current = { counts: prevCounts, userReactions: prevUserReactions };

    // Optimistic update
    const isCurrentlyActive = userReactions.includes(type);
    if (isCurrentlyActive) {
      setCounts((prev) => ({ ...prev, [type]: Math.max(0, prev[type as keyof typeof prev] - 1) }));
      setUserReactions((prev) => prev.filter((r) => r !== type));
    } else {
      setCounts((prev) => ({ ...prev, [type]: prev[type as keyof typeof prev] + 1 }));
      setUserReactions((prev) => [...prev, type]);
    }

    setPendingTypes((prev) => new Set(prev).add(type));

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateId, type }),
      });

      if (!res.ok) {
        // Revert on failure
        setCounts(prevCounts);
        setUserReactions(prevUserReactions);
      }
    } catch {
      // Revert on network error
      setCounts(prevCounts);
      setUserReactions(prevUserReactions);
    } finally {
      setPendingTypes((prev) => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    }
  }

  return (
    <div className="flex gap-2">
      {REACTION_TYPES.map(({ type, label, icon }) => {
        const isActive = userReactions.includes(type);
        const count = counts[type as keyof typeof counts];
        return (
          <button
            key={type}
            onClick={() => toggleReaction(type)}
            disabled={pendingTypes.has(type)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50",
              isActive
                ? "bg-blue-50 text-blue-800 border-2 border-blue-200 shadow-sm"
                : "bg-slate-50 text-slate-500 border-2 border-transparent hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
            {count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-md text-xs font-bold",
                isActive ? "bg-blue-100 text-blue-700" : "bg-slate-200/60 text-slate-500"
              )}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
