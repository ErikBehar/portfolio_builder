"use client";

import { useState } from "react";

import { setAdminFlash } from "@/lib/adminFlash";

export function AdminBackupPanel() {
  const [status, setStatus] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    setIsDownloading(true);
    setStatus("Preparing backup...");

    try {
      const response = await fetch("/api/admin/backup");

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        setStatus(data.error ?? "Failed to create backup");
        return;
      }

      const disposition = response.headers.get("Content-Disposition");
      let filename = "portfolio-backup.zip";
      const match = disposition?.match(/filename="([^"]+)"/);
      if (match) {
        filename = match[1];
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus("Backup downloaded.");
      setAdminFlash("Backup downloaded.");
    } catch {
      setStatus("Failed to create backup");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <section className="mt-12 rounded-xl border border-border bg-surface/50 p-6">
      <h2 className="text-lg font-medium">Data backup</h2>
      <p className="mt-2 text-sm text-muted">
        Download a zip archive containing the SQLite database and all uploaded
        media. Store backups somewhere safe — they include your full site data.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={isDownloading}
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-background disabled:opacity-60"
        >
          {isDownloading ? "Preparing..." : "Download backup"}
        </button>
        {status && <p className="text-sm text-muted">{status}</p>}
      </div>
    </section>
  );
}
