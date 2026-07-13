import Link from "next/link";
import { Suspense } from "react";
import { ProjectTimeline } from "@/components/ProjectTimeline";
import { getTimelinePageData } from "@/lib/timelineData";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const { entries, sectionLegend, allLabels, labelCounts } =
    await getTimelinePageData();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 max-w-3xl">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Portfolio
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Project timeline
        </h1>
        <p className="mt-4 text-lg text-muted">
          All projects across sections, ordered by created date.
        </p>
      </header>

      <Suspense fallback={<div className="text-muted">Loading timeline...</div>}>
        <ProjectTimeline
          entries={entries}
          allLabels={allLabels}
          labelCounts={labelCounts}
          sectionLegend={sectionLegend}
        />
      </Suspense>

      <p className="mt-10 text-sm text-muted">
        <Link href="/" className="text-accent hover:underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
