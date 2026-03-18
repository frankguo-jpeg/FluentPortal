"use client";

import { useState } from "react";

interface ManagerActionsProps {
  weekNumber: number;
  year: number;
}

export function ManagerActions({ weekNumber, year }: ManagerActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function generateRanking() {
    setLoading("ranking");
    setMessage("");
    setIsError(false);

    const res = await fetch(`/api/rankings/generate?weekNumber=${weekNumber}&year=${year}`, {
      method: "POST",
    });
    const data = await res.json();

    if (res.ok) {
      setMessage("Rankings generated successfully! Refresh to see results.");
    } else {
      setMessage(data.error || "Failed to generate rankings");
      setIsError(true);
    }
    setLoading(null);
  }

  async function computeMonthlyScores() {
    setLoading("monthly");
    setMessage("");
    setIsError(false);

    const now = new Date();
    const res = await fetch(
      `/api/rankings/monthly?month=${now.getMonth() + 1}&year=${now.getFullYear()}`,
      { method: "POST" }
    );
    const data = await res.json();

    if (res.ok) {
      setMessage(`Monthly scores computed for ${data.scores.length} companies.`);
    } else {
      setMessage(data.error || "Failed to compute monthly scores");
      setIsError(true);
    }
    setLoading(null);
  }

  return (
    <div className="card p-6">
      <h2 className="section-title mb-4">Actions</h2>

      {message && (
        <div className={`rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2 ${
          isError
            ? "bg-red-50 text-red-600 border border-red-100"
            : "bg-emerald-50 text-emerald-700 border border-emerald-100"
        }`}>
          {isError ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
          {message}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={generateRanking}
          disabled={loading !== null}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          {loading === "ranking" ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          )}
          Generate Rankings (Week {weekNumber})
        </button>
        <button
          onClick={computeMonthlyScores}
          disabled={loading !== null}
          className="btn-secondary flex items-center gap-2 disabled:opacity-50"
        >
          {loading === "monthly" ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          )}
          Compute Monthly Scores
        </button>
      </div>
    </div>
  );
}
