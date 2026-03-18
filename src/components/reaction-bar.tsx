"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const REACTION_TYPES = [
  { type: "LIKE", label: "Like", icon: "👍" },
  { type: "INSIGHTFUL", label: "Insightful", icon: "💡" },
  { type: "INNOVATIVE", label: "Innovative", icon: "🚀" },
] as const;

interface ReactionBarProps {
  updateId: string;
}

export function ReactionBar({ updateId }: ReactionBarProps) {
  const [counts, setCounts] = useState({ LIKE: 0, INSIGHTFUL: 0, INNOVATIVE: 0 });
  const [userReactions, setUserReactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/reactions?updateId=${updateId}`)
      .then((r) => r.json())
      .then((data) => {
        setCounts(data.counts);
        setUserReactions(data.userReactions);
      });
  }, [updateId]);

  async function toggleReaction(type: string) {
    if (loading) return;
    setLoading(true);

    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updateId, type }),
    });
    const data = await res.json();

    if (data.action === "added") {
      setCounts((prev) => ({ ...prev, [type]: prev[type as keyof typeof prev] + 1 }));
      setUserReactions((prev) => [...prev, type]);
    } else {
      setCounts((prev) => ({ ...prev, [type]: prev[type as keyof typeof prev] - 1 }));
      setUserReactions((prev) => prev.filter((r) => r !== type));
    }

    setLoading(false);
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
            disabled={loading}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
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
