import Link from "next/link";
import { HomeSectionHeading } from "@/components/HomeSectionHeading";
import type { LogEntryWithMedia } from "@/lib/types";
import { formatLogDate } from "@/lib/dates";
import { excerptRichText } from "@/lib/richText";

type LogEntryPreviewProps = {
  entry: LogEntryWithMedia;
  headerColor: string;
};

export function LogEntryPreview({ entry, headerColor }: LogEntryPreviewProps) {
  const cover = entry.media[0];

  return (
    <>
      <HomeSectionHeading color={headerColor}>Latest update</HomeSectionHeading>

      <article className="rounded-xl border border-border bg-surface p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="mb-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <Link
                href={`/log/${entry.slug}`}
                className="transition-colors hover:text-accent"
              >
                {entry.title}
              </Link>
            </h3>
            <time className="block text-sm text-muted" dateTime={entry.date}>
              {formatLogDate(entry.date)}
            </time>
          </div>
          <Link
            href="/log/archive"
            className="text-sm text-accent underline-offset-4 hover:underline"
          >
            See all entries →
          </Link>
        </div>

        {cover && (
          <div className="mb-4 overflow-hidden rounded-lg border border-border">
            {cover.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover.url}
                alt={cover.caption ?? entry.title}
                className="aspect-video w-full object-cover"
              />
            ) : (
              <video
                src={cover.url}
                className="aspect-video w-full object-cover"
                muted
                playsInline
              />
            )}
          </div>
        )}

        <p className="whitespace-pre-wrap leading-relaxed text-muted">
          {excerptRichText(entry.content)}
        </p>

        <Link
          href={`/log/${entry.slug}`}
          className="mt-4 inline-block text-sm text-accent underline-offset-4 hover:underline"
        >
          Read full entry
        </Link>
      </article>
    </>
  );
}
