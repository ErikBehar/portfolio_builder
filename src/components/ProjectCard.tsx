import Link from "next/link";
import { formatLogDate } from "@/lib/dates";
import { getProjectCoverMedia } from "@/lib/media";
import type { ProjectWithMedia } from "@/lib/types";
import { RichText } from "@/components/RichText";

type ProjectCardProps = {
  project: ProjectWithMedia;
};

function ProjectPlaceholderIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className="h-10 w-10 text-muted/40"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15l3.5-3.5a1 1 0 0 1 1.4 0L15 14l2-2a1 1 0 0 1 1.4 0L21 14" />
      <circle cx="9" cy="9" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ProjectCard({ project }: ProjectCardProps) {
  const cover = getProjectCoverMedia(project);

  return (
    <Link
      href={`/${project.section}/${project.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-all hover:border-accent hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-surface-elevated">
        {cover?.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={cover.caption ?? project.title}
            className="absolute inset-0 h-full w-full object-contain object-center"
          />
        ) : cover?.type === "video" ? (
          <video
            src={cover.url}
            className="absolute inset-0 h-full w-full object-contain object-center"
            muted
            playsInline
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <ProjectPlaceholderIcon />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {project.category && (
            <span className="text-xs uppercase tracking-wider text-accent">
              {project.category.replace(/-/g, " ")}
            </span>
          )}
          <time
            dateTime={project.createdAt}
            className="text-xs text-muted"
          >
            {formatLogDate(project.createdAt)}
          </time>
        </div>
        <h3 className="text-lg font-semibold text-foreground group-hover:text-accent">
          {project.title}
        </h3>
        <RichText
          content={project.description}
          fallback="Project details coming soon."
          interactive={false}
          className="mt-2 line-clamp-3 flex-1 text-sm text-muted"
        />
        {project.labels.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.labels.map((label) => (
              <span
                key={label.id}
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
              >
                {label.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
