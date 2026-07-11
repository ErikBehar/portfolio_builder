import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectWithMedia } from "@/lib/types";

type ProjectGridProps = {
  projects: ProjectWithMedia[];
  emptyMessage?: string;
};

export function ProjectGrid({
  projects,
  emptyMessage = "No projects in this section yet. Add some from the admin page.",
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
