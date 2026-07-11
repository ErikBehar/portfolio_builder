import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SectionProjectsView } from "@/components/SectionProjectsView";
import { getLabelUsageCountsForSection, getLabels } from "@/lib/labels";
import { getProjectsBySection } from "@/lib/projects";
import { getSection } from "@/lib/sections";

export const dynamic = "force-dynamic";

type SectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function SectionPage({ params }: SectionPageProps) {
  const { slug } = await params;
  const section = await getSection(slug);

  if (!section) {
    notFound();
  }

  const [projects, allLabels, labelCounts] = await Promise.all([
    getProjectsBySection(slug),
    getLabels(),
    getLabelUsageCountsForSection(slug),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 max-w-3xl">
        <div className="mb-2 flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: section.color }}
            aria-hidden
          />
          <p
            className="text-sm uppercase tracking-[0.2em]"
            style={{ color: section.color }}
          >
            Section
          </p>
        </div>
        <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          <span
            className="hidden h-9 w-1 shrink-0 rounded-full sm:inline-block"
            style={{ backgroundColor: section.color }}
            aria-hidden
          />
          {section.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{section.description}</p>
      </header>

      <Suspense fallback={<div className="text-muted">Loading projects...</div>}>
        <SectionProjectsView
          section={section}
          projects={projects}
          allLabels={allLabels}
          labelCounts={labelCounts}
        />
      </Suspense>
    </div>
  );
}
