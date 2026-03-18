"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { METRIC_TEMPLATES } from "@/lib/metrics";
import { MetricInput } from "@/components/metric-input";
import { getCurrentWeek, formatWeekLabel } from "@/lib/utils";

export default function NewUpdatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { weekNumber, year } = getCurrentWeek();

  const [metrics, setMetrics] = useState<Record<string, number | null>>({
    revenueGrowth: null,
    customerAcquisition: null,
    techDebtReduction: null,
    uptime: null,
  });
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session?.user.role !== "COMPANY_ADMIN") {
    return (
      <div className="card p-16 text-center max-w-2xl">
        <p className="text-slate-500">Only company admins can submit updates.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics, details }),
    });

    if (res.ok) {
      router.push("/updates");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to submit update");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Submit Weekly Update</h1>
        <p className="page-subtitle">{formatWeekLabel(weekNumber, year)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        <div className="card p-6">
          <h2 className="section-title mb-1">Metrics</h2>
          <p className="text-xs text-slate-400 mb-5">Enter your key performance indicators for this week.</p>
          <div className="grid gap-4">
            {METRIC_TEMPLATES.map((template) => (
              <MetricInput
                key={template.key}
                label={template.label}
                unit={template.unit}
                description={template.description}
                value={metrics[template.key]}
                onChange={(value) =>
                  setMetrics((prev) => ({ ...prev, [template.key]: value }))
                }
              />
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title mb-1">Details</h2>
          <p className="text-xs text-slate-400 mb-4">
            Share what new technology you implemented, process improvements, or key achievements.
          </p>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={6}
            className="input resize-none"
            placeholder="This week we implemented..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Submitting...
            </span>
          ) : "Submit Update"}
        </button>
      </form>
    </div>
  );
}
