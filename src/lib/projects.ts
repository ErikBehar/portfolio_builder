import { parseLinks, prisma } from "@/lib/db";
import { ensureFeaturedLabel, ensureShowLabel, ensureSystemLabels } from "@/lib/labels";
import type { ProjectComment, ProjectWithMedia } from "@/lib/types";

const projectInclude = {
  media: { orderBy: { sortOrder: "asc" as const } },
  labels: { include: { label: true } },
};

const projectIncludeWithComments = {
  ...projectInclude,
  comments: { orderBy: { createdAt: "asc" as const } },
};

type ProjectRecord = Awaited<
  ReturnType<
    typeof prisma.project.findMany<{
      include: typeof projectInclude;
    }>
  >
>[number];

type ProjectWithCommentsRecord = Awaited<
  ReturnType<
    typeof prisma.project.findFirst<{
      include: typeof projectIncludeWithComments;
    }>
  >
>;

function mapComments(
  comments: { id: string; author: string; content: string; createdAt: Date }[]
): ProjectComment[] {
  return comments.map((comment) => ({
    id: comment.id,
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
  }));
}

function toProjectWithMedia(project: ProjectRecord): ProjectWithMedia {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description,
    section: project.section,
    category: project.category,
    links: parseLinks(project.links),
    sortOrder: project.sortOrder,
    coverMediaId: project.coverMediaId,
    createdAt: project.createdAt.toISOString(),
    labels: project.labels
      .map((entry) => ({
        id: entry.label.id,
        name: entry.label.name,
        slug: entry.label.slug,
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    media: project.media.map((item) => ({
      id: item.id,
      type: item.type as "image" | "video",
      url: item.url,
      caption: item.caption,
      sortOrder: item.sortOrder,
    })),
  };
}

function toProjectWithComments(
  project: NonNullable<ProjectWithCommentsRecord>
): ProjectWithMedia {
  return {
    ...toProjectWithMedia(project),
    comments: mapComments(project.comments),
  };
}

export async function resolveProjectLabelIds(labelIds?: string[]) {
  if (!labelIds || labelIds.length === 0) {
    return [];
  }

  const labels = await prisma.label.findMany({
    where: { id: { in: labelIds } },
  });

  return labels.map((label) => label.id);
}

export async function syncProjectLabels(projectId: string, labelIds?: string[]) {
  await ensureSystemLabels();

  const resolvedIds = await resolveProjectLabelIds(labelIds);

  await prisma.projectLabel.deleteMany({ where: { projectId } });

  if (resolvedIds.length > 0) {
    await prisma.projectLabel.createMany({
      data: resolvedIds.map((labelId) => ({ projectId, labelId })),
    });
  }
}

export async function getProjectsBySection(section: string) {
  const projects = await prisma.project.findMany({
    where: { section },
    include: projectInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return projects.map(toProjectWithMedia);
}

export async function getProjectBySlug(section: string, slug: string) {
  const project = await prisma.project.findFirst({
    where: { section, slug },
    include: projectIncludeWithComments,
  });

  if (!project) return null;
  return toProjectWithComments(project);
}

export async function getProjectById(id: string, includeComments = false) {
  if (includeComments) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: projectIncludeWithComments,
    });

    if (!project) return null;
    return toProjectWithComments(project);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: projectInclude,
  });

  if (!project) return null;
  return toProjectWithMedia(project);
}

export async function getProjectCountsBySection() {
  const counts = await prisma.project.groupBy({
    by: ["section"],
    _count: { section: true },
  });

  return Object.fromEntries(
    counts.map((entry) => [entry.section, entry._count.section])
  ) as Record<string, number>;
}

export async function getProjectsForTimeline() {
  await ensureSystemLabels();
  const showLabel = await ensureShowLabel();

  const projects = await prisma.project.findMany({
    where: {
      labels: { some: { labelId: showLabel.id } },
    },
    include: projectInclude,
    orderBy: { createdAt: "asc" },
  });

  return projects.map(toProjectWithMedia);
}

export async function getFeaturedProjects() {
  const [showLabel, featuredLabel] = await Promise.all([
    ensureShowLabel(),
    ensureFeaturedLabel(),
  ]);

  const projects = await prisma.project.findMany({
    where: {
      AND: [
        { labels: { some: { labelId: showLabel.id } } },
        { labels: { some: { labelId: featuredLabel.id } } },
      ],
    },
    include: projectInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return projects.map(toProjectWithMedia);
}

export async function backfillShowLabels() {
  const showLabel = await ensureShowLabel();
  const projects = await prisma.project.findMany({
    select: { id: true, labels: { select: { labelId: true } } },
  });

  const missing = projects.filter(
    (project) => !project.labels.some((entry) => entry.labelId === showLabel.id)
  );

  if (missing.length > 0) {
    await prisma.projectLabel.createMany({
      data: missing.map((project) => ({
        projectId: project.id,
        labelId: showLabel.id,
      })),
    });
  }

  return missing.length;
}
