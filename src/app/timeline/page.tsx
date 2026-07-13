import Link from "next/link";
import { Suspense } from "react";
import { ProjectTimeline } from "@/components/ProjectTimeline";
import { getLabelUsageCountsForTimeline, getLabels } from "@/lib/labels";
import { getProjectsForTimeline } from "@/lib/projects";
import { getSections } from "@/lib/sections";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const [projects, sections, allLabels, labelCounts] = await Promise.all([
    getProjectsForTimeline(),
    getSections(),
    getLabels(),
    getLabelUsageCountsForTimeline(),
  ]);

  const sectionBySlug = Object.fromEntries(
    sections.map((section) => [section.slug, section])
  );

  const entries = projects.map((project) => {
    const section = sectionBySlug[project.section];

    return {
      project,
      sectionTitle: section?.title ?? project.section,
      sectionColor: section?.color ?? "#5b9fd4",
    };
  });

  const sectionLegend = sections.map((section) => ({
    slug: section.slug,
    title: section.title,
    color: section.color,
  }));

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
