import Link from "next/link";
import { Suspense } from "react";
import { FeaturedProjectsCarousel } from "@/components/FeaturedProjectsCarousel";
import { HomeSectionHeading } from "@/components/HomeSectionHeading";
import { LogEntryPreview } from "@/components/LogEntryPreview";
import { ProjectTimeline } from "@/components/ProjectTimeline";
import { SectionNav } from "@/components/SectionNav";
import { getLatestLogEntry } from "@/lib/log";
import { getFeaturedProjects } from "@/lib/projects";
import { getSections } from "@/lib/sections";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import { getSiteSettings } from "@/lib/siteSettings";
import { inlineLinkClassName } from "@/lib/linkStyles";
import { getTimelinePageData } from "@/lib/timelineData";
import type { HomeSectionId } from "@/lib/homeLayout";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const siteSettings = await getSiteSettings();
  const { homeLayout } = siteSettings;
  const headerColor = siteSettings.homeHeaderColor;
  const visibleSections = homeLayout.sections.filter((section) => section.visible);
  const needsLog = visibleSections.some((section) => section.id === "log");
  const needsFeatured = visibleSections.some((section) => section.id === "featured");
  const needsProjects = visibleSections.some(
    (section) => section.id === "projects"
  );
  const needsTimeline = visibleSections.some(
    (section) => section.id === "timeline"
  );
  const needsTimelineEmbed =
    needsTimeline && homeLayout.timelineMode === "embed";

  const [latestEntry, sections, featuredProjects, timelineData] =
    await Promise.all([
      needsLog ? getLatestLogEntry() : Promise.resolve(null),
      needsProjects || needsTimelineEmbed || needsFeatured
        ? getSections()
        : Promise.resolve([]),
      needsFeatured ? getFeaturedProjects() : Promise.resolve([]),
      needsTimelineEmbed ? getTimelinePageData() : Promise.resolve(null),
    ]);

  const sectionBySlug = Object.fromEntries(
    sections.map((section) => [section.slug, section])
  );

  const featuredEntries = featuredProjects.map((project) => {
    const section = sectionBySlug[project.section];

    return {
      project,
      sectionTitle: section?.title ?? project.section.replace(/-/g, " "),
      sectionColor: section?.color ?? DEFAULT_SECTION_COLOR,
    };
  });

  function renderSection(id: HomeSectionId) {
    switch (id) {
      case "log":
        return (
          <section key="log" className="mb-16">
            {latestEntry ? (
              <LogEntryPreview entry={latestEntry} headerColor={headerColor} />
            ) : (
              <>
                <HomeSectionHeading color={headerColor}>
                  Latest update
                </HomeSectionHeading>
                <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
                  No log entries yet. The latest update will appear here once
                  added.
                </div>
              </>
            )}
          </section>
        );
      case "featured":
        return (
          <div key="featured" className="mb-16">
            <FeaturedProjectsCarousel
              entries={featuredEntries}
              headerColor={headerColor}
            />
          </div>
        );
      case "projects":
        return (
          <section key="projects" className="mb-16">
            <HomeSectionHeading color={headerColor}>Sections</HomeSectionHeading>
            <SectionNav sections={sections} />
          </section>
        );
      case "timeline":
        if (homeLayout.timelineMode === "embed" && timelineData) {
          return (
            <section key="timeline" className="mb-16">
              <HomeSectionHeading color={headerColor}>
                Project timeline
              </HomeSectionHeading>
              <Suspense
                fallback={<div className="text-muted">Loading timeline...</div>}
              >
                <ProjectTimeline
                  entries={timelineData.entries}
                  allLabels={timelineData.allLabels}
                  labelCounts={timelineData.labelCounts}
                  sectionLegend={timelineData.sectionLegend}
                />
              </Suspense>
              <p className="mt-6 text-sm text-muted">
                <Link href="/timeline" className={inlineLinkClassName}>
                  Open full timeline page →
                </Link>
              </p>
            </section>
          );
        }

        return (
          <section key="timeline" className="mb-16">
            <p className="text-center">
              <Link
                href="/timeline"
                className="text-sm text-accent transition-colors hover:underline"
              >
                View all Projects in a Timeline →
              </Link>
            </p>
          </section>
        );
      default:
        return null;
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {visibleSections.map((section) => renderSection(section.id))}
    </div>
  );
}
