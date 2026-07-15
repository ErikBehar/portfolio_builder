import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaCarousel } from "@/components/MediaCarousel";
import { ProjectComments } from "@/components/ProjectComments";
import { RichText } from "@/components/RichText";
import { TrackedExternalLink } from "@/components/TrackedExternalLink";
import { formatLogDate } from "@/lib/dates";
import { getProjectBySlug } from "@/lib/projects";
import { getSection } from "@/lib/sections";
import { getSiteSettings } from "@/lib/siteSettings";
import { inlineLinkClassName } from "@/lib/linkStyles";

export const dynamic = "force-dynamic";

type ProjectPageProps = {
  params: Promise<{ slug: string; projectSlug: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug, projectSlug } = await params;
  const [section, project, siteSettings] = await Promise.all([
    getSection(slug),
    getProjectBySlug(slug, projectSlug),
    getSiteSettings(),
  ]);

  if (!section) {
    notFound();
  }

  if (!project) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-10 max-w-3xl">
        {project.category && (
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
            {project.category.replace(/-/g, " ")}
          </p>
        )}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {project.title}
        </h1>
        <time
          dateTime={project.createdAt}
          className="mt-3 block text-sm text-muted"
        >
          {formatLogDate(project.createdAt)}
        </time>
        <RichText
          content={project.description}
          fallback="Project details coming soon."
          className="mt-4 text-lg text-muted"
          linkSource="rich-text"
          linkContextId={project.id}
        />

        {project.labels.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.labels.map((label) => (
              <span
                key={label.id}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted"
              >
                {label.name}
              </span>
            ))}
          </div>
        )}

        {project.links.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-sm font-medium uppercase tracking-[0.15em] text-muted">
              Links:
            </h2>
            <ul className="flex flex-wrap gap-3">
              {project.links.map((link) => (
                <li key={link.url}>
                  <TrackedExternalLink
                    href={link.url}
                    source="project-links"
                    contextId={project.id}
                    label={link.label}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
                  >
                    {link.label}
                  </TrackedExternalLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      <MediaCarousel media={project.media} />

      <ProjectComments
        projectId={project.id}
        initialComments={project.comments ?? []}
        commentsEnabled={siteSettings.projectCommentsEnabled}
        commentsVisible={siteSettings.projectCommentsVisible}
      />

      <p className="mt-10 text-sm text-muted">
        <Link href={`/${section.slug}`} className={inlineLinkClassName}>
          ← Back to {section.title}
        </Link>
      </p>
    </div>
  );
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug, projectSlug } = await params;
  const project = await getProjectBySlug(slug, projectSlug);
  const section = await getSection(slug);

  if (!project || !section) {
    return { title: "Project" };
  }

  return {
    title: `${project.title} — ${section.title}`,
  };
}
