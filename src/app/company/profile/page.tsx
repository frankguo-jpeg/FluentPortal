"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function CompanyProfilePage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    description: "",
    techStack: "",
    teamSize: "",
    products: "",
    challenges: "",
    goals: "",
  });
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/company/profile");
      if (res.ok) {
        const data = await res.json();
        setCompanyName(data.name || "");
        setForm({
          description: data.description || "",
          techStack: data.techStack || "",
          teamSize: data.teamSize?.toString() || "",
          products: data.products || "",
          challenges: data.challenges || "",
          goals: data.goals || "",
        });
      }
      setFetching(false);
    }
    fetchProfile();
  }, []);

  if (session?.user.role !== "COMPANY_ADMIN") {
    return (
      <div className="card p-16 text-center">
        <p className="text-slate-500">Only company admins can edit the company profile.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const res = await fetch("/api/company/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        teamSize: form.teamSize ? parseInt(form.teamSize) : null,
      }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save profile");
    }
    setLoading(false);
  }

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="w-6 h-6 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  const fields = [
    { key: "description", label: "Company Description", placeholder: "Brief overview of your company, what you do, and your market...", rows: 3 },
    { key: "products", label: "Products & Services", placeholder: "Your main products, target customers, and key capabilities...", rows: 2 },
    { key: "techStack", label: "Current Tech Stack", placeholder: "e.g., React, Node.js, PostgreSQL, AWS, Jira, Zendesk...", rows: 2 },
    { key: "challenges", label: "Current Challenges", placeholder: "What challenges are you facing with support automation, AI adoption, etc.?", rows: 3 },
    { key: "goals", label: "Agentic Transformation Goals", placeholder: "What are your goals for AI-driven support? What outcomes are you targeting?", rows: 3 },
  ];

  return (
    <div className="max-w-2xl animate-fade-in">
      <div className="mb-6">
        <h1 className="page-title">Company Profile</h1>
        <p className="page-subtitle">
          {companyName ? `${companyName} — ` : ""}Provide context about your business to help the AI generate better insights and rankings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            Profile saved successfully!
          </div>
        )}

        {fields.map((field) => (
          <div key={field.key} className="card p-6">
            <label className="section-title mb-1 block">{field.label}</label>
            <textarea
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
              rows={field.rows}
              className="input resize-none mt-2"
              placeholder={field.placeholder}
            />
          </div>
        ))}

        <div className="card p-6">
          <label className="section-title mb-1 block">Team Size</label>
          <input
            type="number"
            value={form.teamSize}
            onChange={(e) => setForm((prev) => ({ ...prev, teamSize: e.target.value }))}
            className="input mt-2"
            placeholder="Number of employees"
            min="1"
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
              Saving...
            </span>
          ) : "Save Profile"}
        </button>
      </form>
    </div>
  );
}
