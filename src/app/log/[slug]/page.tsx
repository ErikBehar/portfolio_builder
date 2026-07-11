import Link from "next/link";
import { notFound } from "next/navigation";
import { LogComments } from "@/components/LogComments";
import { MediaCarousel } from "@/components/MediaCarousel";
import { formatLogDate, getLogEntryBySlug } from "@/lib/log";
import { getSiteSettings } from "@/lib/siteSettings";

type LogEntryPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function LogEntryPage({ params }: LogEntryPageProps) {
  const { slug } = await params;
  const entry = await getLogEntryBySlug(slug);

  if (!entry) {
    notFound();
  }

  const siteSettings = await getSiteSettings();

  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-8">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Log entry
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {entry.title}
        </h1>
        <time className="mt-3 block text-muted" dateTime={entry.date}>
          {formatLogDate(entry.date)}
        </time>
      </header>

      {entry.media.length > 0 && (
        <div className="mb-8">
          <MediaCarousel media={entry.media} />
        </div>
      )}

      <div className="prose-log whitespace-pre-wrap leading-relaxed text-foreground">
        {entry.content}
      </div>

      <LogComments
        logEntryId={entry.id}
        initialComments={entry.comments ?? []}
        commentsEnabled={siteSettings.commentsEnabled}
      />

      <p className="mt-10 text-sm text-muted">
        <Link href="/log/archive" className="text-accent underline-offset-4 hover:underline">
          ← All log entries
        </Link>
      </p>
    </article>
  );
}

export async function generateMetadata({ params }: LogEntryPageProps) {
  const { slug } = await params;
  const entry = await getLogEntryBySlug(slug);

  if (!entry) {
    return { title: "Log entry" };
  }

  return {
    title: `${entry.title} — Log`,
  };
}
