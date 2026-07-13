"use client";

import type { LinkSource } from "@/lib/statsTypes";

function shouldTrackPath(pathname: string): boolean {
  return (
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/uploads") &&
    !pathname.startsWith("/_next")
  );
}

export function trackPageView(pathname: string) {
  if (typeof window === "undefined" || !shouldTrackPath(pathname)) {
    return;
  }

  const sessionKey = `pv:${pathname}`;
  if (sessionStorage.getItem(sessionKey)) {
    return;
  }

  sessionStorage.setItem(sessionKey, "1");

  void fetch("/api/stats/pageview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: pathname,
      referrer: document.referrer || null,
    }),
    keepalive: true,
  });
}

export function trackLinkClick(input: {
  url: string;
  source: LinkSource;
  sourcePath?: string;
  contextId?: string | null;
  label?: string | null;
}) {
  if (typeof window === "undefined") {
    return;
  }

  const payload = JSON.stringify({
    url: input.url,
    source: input.source,
    sourcePath: input.sourcePath ?? window.location.pathname,
    contextId: input.contextId ?? null,
    label: input.label ?? null,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([payload], { type: "application/json" });
    navigator.sendBeacon("/api/stats/link-click", blob);
    return;
  }

  void fetch("/api/stats/link-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}
