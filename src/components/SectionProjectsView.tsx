"use client";

import { useMemo } from "react";
import { ProjectGrid } from "@/components/ProjectGrid";
import { usePersistedLabelFilters } from "@/hooks/usePersistedLabelFilters";
import { projectMatchesLabels } from "@/lib/labelFilter";
import type { Section } from "@/lib/sections";
import { SHOW_LABEL_SLUG, type ProjectLabel, type ProjectWithMedia } from "@/lib/types";

type SectionProjectsViewProps = {
  section: Section;
  projects: ProjectWithMedia[];
  allLabels: ProjectLabel[];
  labelCounts: Record<string, number>;
};

const SECTION_DEFAULT_LABELS = [SHOW_LABEL_SLUG];

function getLabelFontSize(count: number, maxCount: number): string {
  if (maxCount <= 0) return "0.875rem";
  const min = 0.75;
  const max = 1.35;
  const ratio = count / maxCount;
  return `${min + ratio * (max - min)}rem`;
}

export function SectionProjectsView({
  section,
  projects,
  allLabels,
  labelCounts,
}: SectionProjectsViewProps) {
  const { selectedSlugs, toggleLabel } = usePersistedLabelFilters({
    scope: `section:${section.slug}`,
    defaultSlugs: SECTION_DEFAULT_LABELS,
    emptyMeansNone: true,
  });

  const maxCount = Math.max(0, ...Object.values(labelCounts));

  const filteredProjects = useMemo(
    () => projects.filter((project) => projectMatchesLabels(project, selectedSlugs)),
    [projects, selectedSlugs]
  );

  const emptyMessage =
    selectedSlugs.length === 0
      ? "Select one or more labels to show projects."
      : "No projects match the selected labels.";

  const grouped = section.categories
    ? section.categories.map((category) => ({
        ...category,
        projects: filteredProjects.filter(
          (project) => project.category === category.slug
        ),
      }))
    : null;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
          Filter by label
        </h2>
        <div className="flex flex-wrap gap-3">
          {allLabels.map((label) => {
            const count = labelCounts[label.slug] ?? 0;
            const selected = selectedSlugs.includes(label.slug);

            return (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.slug)}
                className={`rounded-full border px-4 py-2 transition-colors ${
                  selected
                    ? "border-accent bg-accent/15 text-accent"
                    : "border-border bg-surface text-muted hover:border-accent/60 hover:text-foreground"
                }`}
                style={{ fontSize: getLabelFontSize(count, maxCount) }}
              >
                {label.name}
                {count > 0 && (
                  <span className="ml-2 text-xs opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {grouped ? (
        <div className="space-y-10">
          {grouped.map((group) => (
            <section key={group.slug}>
              <h2 className="mb-4 text-xl font-semibold">{group.title}</h2>
              <ProjectGrid
                projects={group.projects}
                emptyMessage={
                  filteredProjects.length === 0
                    ? emptyMessage
                    : `No projects in ${group.title}.`
                }
              />
            </section>
          ))}
        </div>
      ) : (
        <ProjectGrid projects={filteredProjects} emptyMessage={emptyMessage} />
      )}
    </div>
  );
}
