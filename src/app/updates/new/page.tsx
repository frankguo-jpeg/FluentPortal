"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { METRIC_TEMPLATES } from "@/lib/metrics";
import { MetricInput } from "@/components/metric-input";
import { getCurrentWeek, formatWeekLabel } from "@/lib/utils";

interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export default function NewUpdatePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { weekNumber, year } = getCurrentWeek();

  const [metrics, setMetrics] = useState<Record<string, number | null>>({
    aiSupportPercent: null,
    supportCostRevenue: null,
    npsCsat: null,
    firstContactResolution: null,
    avgTimeToResolution: null,
    repeatContactRate: null,
    ticketDeflectionRate: null,
  });
  const [details, setDetails] = useState("");
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (session?.user.role !== "COMPANY_ADMIN") {
    return (
      <div className="card p-16 text-center max-w-2xl">
        <p className="text-slate-500">Only company admins can submit updates.</p>
      </div>
    );
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setAttachments((prev) => [...prev, data]);
      } else {
        const data = await res.json();
        setError(data.error || `Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics, details, attachments: attachments.length > 0 ? attachments : undefined }),
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
          <h2 className="section-title mb-1">Support KPIs</h2>
          <p className="text-xs text-slate-400 mb-5">Enter your agentic support metrics for this week.</p>
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

        <div className="card p-6">
          <h2 className="section-title mb-1">Attachments</h2>
          <p className="text-xs text-slate-400 mb-4">
            Upload supporting documents, screenshots, or reports (PDF, PNG, JPEG — max 5MB each).
          </p>

          {attachments.length > 0 && (
            <div className="space-y-2 mb-4">
              {attachments.map((file, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                    </svg>
                    <span className="text-sm text-slate-700 truncate">{file.filename}</span>
                    <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(0)}KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-4 px-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
            {uploading ? (
              <svg className="w-5 h-5 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
              </svg>
            )}
            <span className="text-sm text-slate-500">{uploading ? "Uploading..." : "Choose files to upload"}</span>
            <input
              type="file"
              multiple
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || uploading}
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
