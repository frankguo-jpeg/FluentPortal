"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center -m-8 p-8" style={{ background: "linear-gradient(135deg, #1a2332 0%, #243447 40%, #2d4a6a 100%)" }}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(74, 144, 217, 0.08)" }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(74, 144, 217, 0.05)" }} />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2d6cb5 100%)", boxShadow: "0 8px 32px rgba(74, 144, 217, 0.25)" }}>
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FluentPortal</h1>
          <p className="text-sm mt-1" style={{ color: "rgba(148, 177, 215, 0.6)" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl p-8 space-y-5" style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 25px 50px rgba(0,0,0,0.25)" }}>
          {error && (
            <div className="text-sm px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5" style={{ color: "rgba(148, 177, 215, 0.8)" }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="admin@flexigrant.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5" style={{ color: "rgba(148, 177, 215, 0.8)" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-white transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-medium py-3 rounded-xl transition-all duration-200 disabled:opacity-50 active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #4a90d9 0%, #2d6cb5 100%)", boxShadow: "0 4px 15px rgba(74, 144, 217, 0.3)" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <p className="text-[11px] text-center mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
            Default password: password123
          </p>
        </form>
      </div>
    </div>
  );
}
