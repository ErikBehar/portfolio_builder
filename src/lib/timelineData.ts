import { getLabelUsageCountsForTimeline, getLabels } from "@/lib/labels";
import { getProjectsForTimeline } from "@/lib/projects";
import { getSections } from "@/lib/sections";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import type { TimelineEntry, SectionLegendItem } from "@/components/ProjectTimeline";

export async function getTimelinePageData(): Promise<{
  entries: TimelineEntry[];
  sectionLegend: SectionLegendItem[];
  allLabels: Awaited<ReturnType<typeof getLabels>>;
  labelCounts: Record<string, number>;
}> {
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
      sectionColor: section?.color ?? DEFAULT_SECTION_COLOR,
    };
  });

  const sectionLegend = sections.map((section) => ({
    slug: section.slug,
    title: section.title,
    color: section.color,
  }));

  return { entries, sectionLegend, allLabels, labelCounts };
}
