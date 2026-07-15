import { parseDateInput } from "@/lib/dates";
import { ApiError } from "@/lib/apiErrors";
import { prisma } from "@/lib/db";
import { parseLinks, sanitizeProjectLinks } from "@/lib/links";
import { ensureFeaturedLabel, ensureShowLabel, ensureSystemLabels } from "@/lib/labels";
import { resolveLabelIdsWithSectionLabel } from "@/lib/sectionLabels";
import {
  buildMediaCreateInput,
  replaceProjectMedia,
  type MediaInput,
} from "@/lib/mediaSync";
import { resolveCoverMediaId } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { getSection } from "@/lib/sections";
import { deleteUploadFiles } from "@/lib/uploads";
import type { ProjectComment, ProjectLink, ProjectWithMedia } from "@/lib/types";

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
  const projects = await prisma.project.findMany({
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

export type ProjectInput = {
  title?: string;
  section?: string;
  description?: string | null;
  category?: string | null;
  links?: ProjectLink[];
  createdAt?: string;
  media?: MediaInput[];
  previewMediaIndex?: number | null;
  labelIds?: string[];
};

async function validateProjectInput(body: ProjectInput, existingId?: string) {
  const section = await getSection(body.section ?? "");
  if (!section) {
    throw new ApiError("Invalid section", 400);
  }

  if (!body.title?.trim()) {
    throw new ApiError("Title is required", 400);
  }

  const slug = slugify(body.title);
  const conflict = await prisma.project.findFirst({
    where: {
      section: section.slug,
      slug,
      ...(existingId ? { NOT: { id: existingId } } : {}),
    },
  });

  if (conflict) {
    throw new ApiError(
      "A project with this title already exists in this section",
      409
    );
  }

  return { section, slug, title: body.title.trim() };
}

async function saveProjectRecord(
  id: string | null,
  body: ProjectInput,
  previousMediaUrls: string[] = []
) {
  const { section, slug, title } = await validateProjectInput(body, id ?? undefined);

  if (id) {
    await replaceProjectMedia(id, previousMediaUrls, body.media ?? []);
  }

  const data = {
    title,
    slug,
    description: body.description ?? null,
    section: section.slug,
    category: body.category ?? null,
    links: JSON.stringify(sanitizeProjectLinks(body.links)),
    createdAt: body.createdAt ? parseDateInput(body.createdAt) : undefined,
    media: {
      create: buildMediaCreateInput(body.media ?? []),
    },
  };

  const project = id
    ? await prisma.project.update({
        where: { id },
        data,
        include: projectInclude,
      })
    : await prisma.project.create({
        data,
        include: projectInclude,
      });

  const coverMediaId = resolveCoverMediaId(
    project.media,
    body.previewMediaIndex
  );

  const savedProject =
    coverMediaId === project.coverMediaId
      ? project
      : await prisma.project.update({
          where: { id: project.id },
          data: { coverMediaId },
          include: projectInclude,
        });

  await syncProjectLabels(
    project.id,
    await resolveLabelIdsWithSectionLabel(
      body.labelIds,
      section.slug,
      section.title
    )
  );

  const withLabels = await prisma.project.findUnique({
    where: { id: savedProject.id },
    include: projectInclude,
  });

  if (!withLabels) {
    throw new ApiError("Project not found", 404);
  }

  return toProjectWithMedia(withLabels);
}

export async function listProjects(section?: string | null) {
  const projects = await prisma.project.findMany({
    where: section ? { section } : undefined,
    include: projectInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return projects.map(toProjectWithMedia);
}

export async function createProject(body: ProjectInput) {
  return saveProjectRecord(null, body);
}

export async function updateProject(id: string, body: ProjectInput) {
  const existing = await prisma.project.findUnique({
    where: { id },
    include: { media: true },
  });

  if (!existing) {
    throw new ApiError("Project not found", 404);
  }

  return saveProjectRecord(
    id,
    body,
    existing.media.map((item) => item.url)
  );
}

export async function deleteProject(id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { media: true },
  });

  if (!project) {
    throw new ApiError("Project not found", 404);
  }

  const mediaUrls = project.media.map((item) => item.url);
  await prisma.project.delete({ where: { id } });
  await deleteUploadFiles(mediaUrls);
}
