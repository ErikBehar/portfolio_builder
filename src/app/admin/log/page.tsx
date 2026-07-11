import Link from "next/link";
import { formatLogDate } from "@/lib/dates";
import { getLogEntries } from "@/lib/log";

export default async function AdminLogPage() {
  const entries = await getLogEntries();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
            Admin · Log
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Log entries</h1>
          <p className="mt-2 text-muted">
            Blog-style entries with title, date, text, media carousel, and comments.
          </p>
        </div>

        <Link
          href="/admin/log/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
        >
          + New entry
        </Link>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          No log entries yet. Create your first one above.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4"
            >
              <div>
                <h2 className="font-medium">{entry.title}</h2>
                <p className="text-sm text-muted">
                  {formatLogDate(entry.date)} · {entry.media.length} media item
                  {entry.media.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/log/${entry.slug}`}
                  className="text-sm text-muted hover:text-foreground"
                >
                  View
                </Link>
                <Link
                  href={`/admin/log/${entry.id}`}
                  className="text-sm text-accent hover:underline"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
