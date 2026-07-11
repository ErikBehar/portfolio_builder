import Link from "next/link";
import { FeaturedProjectsCarousel } from "@/components/FeaturedProjectsCarousel";
import { HomeSectionHeading } from "@/components/HomeSectionHeading";
import { LogEntryPreview } from "@/components/LogEntryPreview";
import { SectionNav } from "@/components/SectionNav";
import { getLatestLogEntry } from "@/lib/log";
import { getFeaturedProjects } from "@/lib/projects";
import { getSections } from "@/lib/sections";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import { getSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [latestEntry, sections, featuredProjects, siteSettings] = await Promise.all([
    getLatestLogEntry(),
    getSections(),
    getFeaturedProjects(),
    getSiteSettings(),
  ]);

  const headerColor = siteSettings.homeHeaderColor;

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

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <section className="mb-16">
        {latestEntry ? (
          <LogEntryPreview entry={latestEntry} headerColor={headerColor} />
        ) : (
          <>
            <HomeSectionHeading color={headerColor}>Latest update</HomeSectionHeading>
            <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
              No log entries yet. The latest update will appear here once added.
            </div>
          </>
        )}
      </section>

      <FeaturedProjectsCarousel
        entries={featuredEntries}
        headerColor={headerColor}
      />

      <section>
        <HomeSectionHeading color={headerColor}>Sections</HomeSectionHeading>
        <SectionNav sections={sections} />

        <p className="mt-8 text-center">
          <Link
            href="/timeline"
            className="text-sm text-accent transition-colors hover:underline"
          >
            View all Projects in a Timeline →
          </Link>
        </p>
      </section>
    </div>
  );
}
