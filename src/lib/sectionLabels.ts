import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";

let backfillPromise: Promise<void> | null = null;

export async function isSectionLabelSlug(slug: string): Promise<boolean> {
  const section = await prisma.portfolioSection.findUnique({
    where: { slug },
    select: { id: true },
  });
  return section !== null;
}

export async function ensureSectionLabel(sectionSlug: string, sectionTitle: string) {
  const existing = await prisma.label.findUnique({
    where: { slug: sectionSlug },
  });

  if (existing) {
    if (existing.name !== sectionTitle) {
      return prisma.label.update({
        where: { id: existing.id },
        data: { name: sectionTitle },
      });
    }
    return existing;
  }

  return prisma.label.create({
    data: {
      name: sectionTitle,
      slug: sectionSlug,
    },
  });
}

export async function assignSectionLabelToProjects(
  sectionSlug: string,
  labelId: string
) {
  const projects = await prisma.project.findMany({
    where: { section: sectionSlug },
    select: { id: true },
  });

  if (projects.length === 0) return;

  const existing = await prisma.projectLabel.findMany({
    where: {
      labelId,
      projectId: { in: projects.map((project) => project.id) },
    },
    select: { projectId: true },
  });

  const assigned = new Set(existing.map((entry) => entry.projectId));
  const missing = projects.filter((project) => !assigned.has(project.id));

  if (missing.length === 0) return;

  await prisma.projectLabel.createMany({
    data: missing.map((project) => ({
      projectId: project.id,
      labelId,
    })),
  });
}

export async function syncSectionLabelForSection(
  sectionSlug: string,
  sectionTitle: string
) {
  const label = await ensureSectionLabel(sectionSlug, sectionTitle);
  await assignSectionLabelToProjects(sectionSlug, label.id);
  return label;
}

export async function updateSectionLabelMetadata(
  previousSlug: string,
  nextSlug: string,
  nextTitle: string
) {
  const label = await prisma.label.findUnique({
    where: { slug: previousSlug },
  });

  if (!label) {
    return syncSectionLabelForSection(nextSlug, nextTitle);
  }

  if (previousSlug !== nextSlug) {
    const conflict = await prisma.label.findUnique({
      where: { slug: nextSlug },
    });
    if (conflict && conflict.id !== label.id) {
      throw new ApiError("A label with the new section slug already exists", 409);
    }
  }

  const updated =
    previousSlug === nextSlug && label.name === nextTitle
      ? label
      : await prisma.label.update({
          where: { id: label.id },
          data: {
            slug: nextSlug,
            name: nextTitle,
          },
        });

  await assignSectionLabelToProjects(nextSlug, updated.id);
  return updated;
}

export async function deleteSectionLabel(sectionSlug: string) {
  const label = await prisma.label.findUnique({
    where: { slug: sectionSlug },
  });

  if (!label) return;

  await prisma.label.delete({ where: { id: label.id } });
}

export async function resolveLabelIdsWithSectionLabel(
  labelIds: string[] | undefined,
  sectionSlug: string,
  sectionTitle: string
) {
  const sectionLabel = await ensureSectionLabel(sectionSlug, sectionTitle);
  const ids = new Set(labelIds ?? []);
  ids.add(sectionLabel.id);
  return [...ids];
}

export async function backfillSectionLabels() {
  const sections = await prisma.portfolioSection.findMany({
    select: { slug: true, title: true },
  });

  for (const section of sections) {
    await syncSectionLabelForSection(section.slug, section.title);
  }
}

export function ensureSectionLabelsBackfilled() {
  if (!backfillPromise) {
    backfillPromise = backfillSectionLabels().catch((error) => {
      backfillPromise = null;
      throw error;
    });
  }

  return backfillPromise;
}
