"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export function AdminMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isAdminArea =
    pathname.startsWith("/admin") && pathname !== "/admin/login";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setShowPassword(false);
        setPassword("");
        setError(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Invalid password");
      return;
    }

    setOpen(false);
    setShowPassword(false);
    setPassword("");
    router.push("/admin");
    router.refresh();
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);

    await fetch("/api/admin/auth", { method: "DELETE" });

    setLoading(false);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          setShowPassword(false);
          setError(null);
        }}
        aria-label="Settings menu"
        aria-expanded={open}
        className="rounded-md border border-border p-2 text-muted transition-colors hover:border-accent hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          className="h-4 w-4"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-border bg-surface p-3 shadow-xl">
          {isAdminArea ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={loading}
              className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-elevated disabled:opacity-60"
            >
              {loading ? "Logging out..." : "Log out"}
            </button>
          ) : !showPassword ? (
            <button
              type="button"
              onClick={() => setShowPassword(true)}
              className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-surface-elevated"
            >
              Admin
            </button>
          ) : (
            <form onSubmit={handleLogin} className="space-y-3">
              <p className="text-sm font-medium">Admin password</p>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoFocus
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Enter password"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
              >
                {loading ? "Checking..." : "Enter admin"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
