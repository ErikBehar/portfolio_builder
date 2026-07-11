import Link from "next/link";
import { formatLogDate } from "@/lib/dates";
import { getLogEntries } from "@/lib/log";

export default async function LogArchivePage() {
  const entries = await getLogEntries();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Log
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">All entries</h1>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          No log entries yet.
        </div>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/log/${entry.slug}`}
                className="block rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
              >
                <time className="text-sm text-accent" dateTime={entry.date}>
                  {formatLogDate(entry.date)}
                </time>
                <h2 className="mt-1 text-xl font-semibold">{entry.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {entry.content.trim()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-10 text-sm text-muted">
        <Link href="/" className="text-accent underline-offset-4 hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
