"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ADMIN_FLASH_EVENT,
  consumeAdminFlash,
} from "@/lib/adminFlash";

const DISPLAY_MS = 4000;

export function AdminFlashBanner() {
  const pathname = usePathname();
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function show(next: string) {
    setMessage(next);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setMessage(null);
      timeoutRef.current = null;
    }, DISPLAY_MS);
  }

  useEffect(() => {
    function onFlash(event: Event) {
      const detail = (event as CustomEvent<string>).detail;
      if (typeof detail === "string" && detail.trim()) {
        consumeAdminFlash();
        show(detail);
      }
    }

    window.addEventListener(ADMIN_FLASH_EVENT, onFlash);
    return () => {
      window.removeEventListener(ADMIN_FLASH_EVENT, onFlash);
    };
  }, []);

  useEffect(() => {
    const existing = consumeAdminFlash();
    if (existing) {
      show(existing);
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!message) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-accent/40 bg-surface-elevated px-4 py-3 text-center text-sm shadow-xl shadow-black/30"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
