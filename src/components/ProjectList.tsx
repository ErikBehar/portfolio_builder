import Link from "next/link";
import { formatLogDate } from "@/lib/dates";
import type { ProjectWithMedia } from "@/lib/types";
import { RichText } from "@/components/RichText";

type ProjectListProps = {
  projects: ProjectWithMedia[];
  emptyMessage?: string;
  showCategory?: boolean;
};

export function ProjectList({
  projects,
  emptyMessage = "No projects in this section yet. Add some from the admin page.",
  showCategory = true,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
        {emptyMessage}
      </div>
    );
  }

  const ordered = [...projects].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
      {ordered.map((project) => (
        <li key={project.id}>
          <Link
            href={`/${project.section}/${project.slug}`}
            className="group flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-surface-elevated sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-foreground group-hover:text-accent">
                  {project.title}
                </h3>
                {showCategory && project.category && (
                  <span className="text-xs uppercase tracking-wider text-accent">
                    {project.category.replace(/-/g, " ")}
                  </span>
                )}
              </div>
              {project.description && (
                <RichText
                  content={project.description}
                  interactive={false}
                  className="mt-1 line-clamp-1 text-sm text-muted"
                />
              )}
            </div>
            <time
              dateTime={project.createdAt}
              className="shrink-0 text-sm text-muted"
            >
              {formatLogDate(project.createdAt)}
            </time>
          </Link>
        </li>
      ))}
    </ul>
  );
}
