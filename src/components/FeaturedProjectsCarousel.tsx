"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HomeSectionHeading } from "@/components/HomeSectionHeading";
import { formatLogDate } from "@/lib/dates";
import { getProjectCoverMedia } from "@/lib/media";
import type { ProjectWithMedia } from "@/lib/types";
import { RichText } from "@/components/RichText";

export type FeaturedProjectEntry = {
  project: ProjectWithMedia;
  sectionTitle: string;
  sectionColor: string;
};

type FeaturedProjectsCarouselProps = {
  entries: FeaturedProjectEntry[];
  headerColor: string;
};

const ROTATE_MS = 3000;
const FADE_MS = 700;

function ProjectPlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className="h-10 w-10 text-muted/40"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15l3.5-3.5a1 1 0 0 1 1.4 0L15 14l2-2a1 1 0 0 1 1.4 0L21 14" />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FeaturedSlide({ entry }: { entry: FeaturedProjectEntry }) {
  const cover = getProjectCoverMedia(entry.project);
  const href = `/${entry.project.section}/${entry.project.slug}`;

  return (
    <Link
      href={href}
      className="group grid overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-surface-elevated sm:aspect-auto sm:min-h-56">
        {cover?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt=""
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
        ) : cover?.type === "video" ? (
          <video
            src={cover.url}
            className="absolute inset-0 h-full w-full object-contain object-center"
            muted
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ProjectPlaceholderIcon />
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center p-6">
        <div className="mb-3 flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border border-white/40"
            style={{ backgroundColor: entry.sectionColor }}
            aria-hidden
          />
          <p
            className="text-xs font-medium uppercase tracking-[0.2em]"
            style={{ color: entry.sectionColor }}
          >
            {entry.sectionTitle}
          </p>
        </div>

        <h3 className="text-2xl font-semibold text-foreground transition-colors group-hover:text-accent">
          {entry.project.title}
        </h3>

        <time
          dateTime={entry.project.createdAt}
          className="mt-2 block text-sm text-muted"
        >
          {formatLogDate(entry.project.createdAt)}
        </time>

        {entry.project.description && (
          <RichText
            content={entry.project.description}
            interactive={false}
            className="mt-4 line-clamp-3 text-sm text-muted"
          />
        )}

        <span className="mt-5 text-sm text-accent">View project →</span>
      </div>
    </Link>
  );
}

export function FeaturedProjectsCarousel({
  entries,
  headerColor,
}: FeaturedProjectsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (entries.length <= 1 || isPaused) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % entries.length);
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [entries.length, isPaused]);

  if (entries.length === 0) return null;

  return (
    <section
      className="mb-16"
      aria-label="Featured projects"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
    >
      <HomeSectionHeading color={headerColor}>
        Featured projects
      </HomeSectionHeading>

      <div className="relative">
        <div className="grid">
          {entries.map((entry, index) => {
            const isActive = index === activeIndex;

            return (
              <article
                key={entry.project.id}
                className={`col-start-1 row-start-1 transition-opacity duration-700 ${
                  isActive
                    ? "pointer-events-auto z-10 opacity-100"
                    : "pointer-events-none z-0 opacity-0"
                }`}
                style={{ transitionDuration: `${FADE_MS}ms` }}
                aria-hidden={!isActive}
              >
                <FeaturedSlide entry={entry} />
              </article>
            );
          })}
        </div>

        {entries.length > 1 && (
          <div
            className="mt-4 flex justify-center gap-2"
            role="tablist"
            aria-label="Featured project slides"
          >
            {entries.map((entry, index) => (
              <button
                key={entry.project.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={`Show ${entry.project.title}`}
                onClick={() => setActiveIndex(index)}
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  index === activeIndex
                    ? "bg-accent"
                    : "bg-border hover:bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
