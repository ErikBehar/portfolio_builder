"use client";

import { useMemo } from "react";
import { CategoryGroupHeader } from "@/components/CategoryGroupHeader";
import { ProjectGrid } from "@/components/ProjectGrid";
import { ProjectList } from "@/components/ProjectList";
import { usePersistedCategoryFilters } from "@/hooks/usePersistedCategoryFilters";
import { usePersistedLabelFilters } from "@/hooks/usePersistedLabelFilters";
import { usePersistedSectionViewMode } from "@/hooks/usePersistedSectionViewMode";
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
  const categories = section.categories ?? [];
  const categorySlugs = useMemo(
    () => section.categories?.map((category) => category.slug) ?? [],
    [section.categories]
  );
  const { selectedSlugs, toggleLabel } = usePersistedLabelFilters({
    scope: `section:${section.slug}`,
    defaultSlugs: SECTION_DEFAULT_LABELS,
    emptyMeansNone: true,
  });
  const {
    selectedSlugs: selectedCategorySlugs,
    toggleCategory,
    showAllCategories,
  } = usePersistedCategoryFilters(`section:${section.slug}`, categorySlugs);
  const { mode, setMode } = usePersistedSectionViewMode(
    `section:${section.slug}`
  );

  const maxCount = Math.max(0, ...Object.values(labelCounts));
  const allCategoriesSelected =
    categorySlugs.length > 0 &&
    selectedCategorySlugs.length === categorySlugs.length;
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const project of projects) {
      if (!project.category) continue;
      counts[project.category] = (counts[project.category] ?? 0) + 1;
    }
    return counts;
  }, [projects]);

  const filteredProjects = useMemo(
    () => projects.filter((project) => projectMatchesLabels(project, selectedSlugs)),
    [projects, selectedSlugs]
  );

  const emptyMessage =
    categories.length > 0 && selectedCategorySlugs.length === 0
      ? "Select one or more categories to show projects."
      : selectedSlugs.length === 0
        ? "Select one or more labels to show projects."
        : "No projects match the selected labels.";

  const grouped = categories.length
    ? categories
        .filter((category) => selectedCategorySlugs.includes(category.slug))
        .map((category) => ({
          ...category,
          projects: filteredProjects.filter(
            (project) => project.category === category.slug
          ),
        }))
    : null;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
          View type
        </h2>
        <div
          className="inline-flex rounded-lg border border-border bg-surface p-1"
          role="group"
          aria-label="Project layout"
        >
          <button
            type="button"
            onClick={() => setMode("grid")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === "grid"
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            }`}
            aria-pressed={mode === "grid"}
          >
            Cards
          </button>
          <button
            type="button"
            onClick={() => setMode("list")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              mode === "list"
                ? "bg-accent/15 text-accent"
                : "text-muted hover:text-foreground"
            }`}
            aria-pressed={mode === "list"}
          >
            List
          </button>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
            Categories
          </h2>

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter by category"
          >
            {categories.map((category) => {
              const count = categoryCounts[category.slug] ?? 0;
              const selected = selectedCategorySlugs.includes(category.slug);

              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => toggleCategory(category.slug)}
                  aria-pressed={selected}
                  className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
                    selected
                      ? "shadow-sm"
                      : "border-border bg-surface text-muted hover:bg-surface-elevated hover:text-foreground"
                  }`}
                  style={
                    selected
                      ? {
                          borderColor: section.color,
                          backgroundColor: `color-mix(in srgb, ${section.color} 18%, transparent)`,
                          color: section.color,
                        }
                      : undefined
                  }
                >
                  <span
                    aria-hidden
                    className={`mr-2 inline-block h-2 w-2 rounded-full ${
                      selected ? "" : "bg-muted/40"
                    }`}
                    style={
                      selected ? { backgroundColor: section.color } : undefined
                    }
                  />
                  {category.title}
                  <span className="ml-2 text-xs font-normal opacity-70">({count})</span>
                </button>
              );
            })}
            {!allCategoriesSelected && (
              <button
                type="button"
                onClick={showAllCategories}
                className="px-2 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                Show all
              </button>
            )}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
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

      {grouped && grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
          {emptyMessage}
        </div>
      ) : mode === "list" ? (
        grouped ? (
          <div className="space-y-28">
            {grouped.map((group) => (
              <section key={group.slug} id={`category-${group.slug}`}>
                <CategoryGroupHeader
                  title={group.title}
                  accentColor={section.color}
                />
                <ProjectList
                  projects={group.projects}
                  showCategory={false}
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
          <ProjectList projects={filteredProjects} emptyMessage={emptyMessage} />
        )
      ) : grouped ? (
        <div className="space-y-28">
          {grouped.map((group) => (
            <section key={group.slug} id={`category-${group.slug}`}>
              <CategoryGroupHeader
                title={group.title}
                accentColor={section.color}
              />
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
