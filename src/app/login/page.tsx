"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium text-gray-900 mb-1">
            Re<span className="text-brand-500">call</span>
          </h1>
          <p className="text-sm text-gray-500">Your daily knowledge digest</p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <div className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M3 10l5 5 9-9" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Check your email</p>
            <p className="text-sm text-gray-500">
              We sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Sending..." : "Continue with email"}
              </button>
            </form>

            <p className="text-xs text-gray-400 text-center mt-4">
              No password needed. We&apos;ll email you a sign-in link.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
