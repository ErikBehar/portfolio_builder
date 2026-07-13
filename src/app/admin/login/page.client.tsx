"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { safeAdminRedirectPath } from "@/lib/safeRedirect";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = safeAdminRedirectPath(searchParams.get("from"));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Invalid password");
        setLoading(false);
        return;
      }

      // Full navigation so the new session cookie is included on the next request.
      window.location.assign(redirectTo);
    } catch {
      setError("Could not sign in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6 py-12">
      <header className="mb-8 text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin
        </p>
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          Enter the admin password to continue.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-surface p-6">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
            placeholder="Admin password"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
