"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirect}`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Check your email</h2>
        <p className="text-gray-600">
          We sent a magic link to <strong>{email}</strong>.<br />
          Click it to sign in — no password needed.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 px-4 bg-masters-green text-white font-semibold rounded-lg hover:bg-green-800 disabled:opacity-50 transition-colors"
      >
        {loading ? "Sending..." : "Send magic link"}
      </button>
      <p className="text-xs text-center text-gray-500">
        No account needed — just enter your email and we'll send a sign-in link.
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen masters-header flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">⛳</div>
          <h1 className="text-2xl font-bold text-gray-900">Masters Pool</h1>
          <p className="text-gray-500 mt-1">Sign in to make your picks</p>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
