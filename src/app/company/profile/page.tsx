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
  const [editing, setEditing] = useState(false);
  const [savedForm, setSavedForm] = useState(form);

  useEffect(() => {
    async function fetchProfile() {
      const res = await fetch("/api/company/profile");
      if (res.ok) {
        const data = await res.json();
        setCompanyName(data.name || "");
        const loaded = {
          description: data.description || "",
          techStack: data.techStack || "",
          teamSize: data.teamSize?.toString() || "",
          products: data.products || "",
          challenges: data.challenges || "",
          goals: data.goals || "",
        };
        setForm(loaded);
        setSavedForm(loaded);
        // Auto-enter edit mode if profile is empty
        if (!data.description && !data.techStack && !data.products) {
          setEditing(true);
        }
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
      setSavedForm(form);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to save profile");
    }
    setLoading(false);
  }

  function handleCancel() {
    setForm(savedForm);
    setEditing(false);
    setError("");
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

  const profileFields = [
    { key: "description", label: "Company Description", placeholder: "Brief overview of your company, what you do, and your market..." },
    { key: "products", label: "Products & Services", placeholder: "Main products, target customers, and key capabilities..." },
    { key: "techStack", label: "Tech Stack", placeholder: "e.g., React, Node.js, PostgreSQL, AWS, Jira, Zendesk..." },
    { key: "challenges", label: "Current Challenges", placeholder: "What challenges are you facing with support automation, AI adoption, etc.?" },
    { key: "goals", label: "Transformation Goals", placeholder: "What are your goals for AI-driven support? What outcomes are you targeting?" },
  ];

  return (
    <div className="max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-700 font-bold text-base">
            {companyName.charAt(0)}
          </div>
          <div>
            <h1 className="page-title">{companyName || "Company Profile"}</h1>
            <p className="text-sm text-slate-400">Business context for AI-powered insights</p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Edit
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm mb-5">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          Profile saved successfully!
        </div>
      )}

      {editing ? (
        /* Edit Mode */
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-5">
            {profileFields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">{field.label}</label>
                <textarea
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  rows={field.key === "description" || field.key === "challenges" || field.key === "goals" ? 3 : 2}
                  className="input resize-none"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Team Size</label>
              <input
                type="number"
                value={form.teamSize}
                onChange={(e) => setForm((prev) => ({ ...prev, teamSize: e.target.value }))}
                className="input w-32"
                placeholder="e.g., 45"
                min="1"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 py-2.5 disabled:opacity-50"
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
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        /* View Mode */
        <div className="card divide-y divide-slate-100">
          {profileFields.map((field) => {
            const value = form[field.key as keyof typeof form];
            return (
              <div key={field.key} className="px-6 py-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{field.label}</p>
                {value ? (
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{value}</p>
                ) : (
                  <p className="text-sm text-slate-300 italic">Not provided</p>
                )}
              </div>
            );
          })}
          <div className="px-6 py-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Team Size</p>
            {form.teamSize ? (
              <p className="text-sm text-slate-700">{form.teamSize} employees</p>
            ) : (
              <p className="text-sm text-slate-300 italic">Not provided</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
