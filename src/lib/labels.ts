import { prisma, slugify } from "@/lib/db";
import { FEATURED_LABEL_SLUG, SHOW_LABEL_SLUG } from "@/lib/types";
import type { ProjectLabel } from "@/lib/types";

export type LabelRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toLabel(record: LabelRecord): ProjectLabel & { createdAt: string } {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getLabels() {
  await ensureSystemLabels();

  const labels = await prisma.label.findMany({
    orderBy: [{ name: "asc" }],
  });

  return labels.map(toLabel);
}

export async function getLabelById(id: string) {
  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) return null;
  return toLabel(label);
}

export async function getLabelBySlug(slug: string) {
  const label = await prisma.label.findUnique({ where: { slug } });
  if (!label) return null;
  return toLabel(label);
}

export async function getShowLabel() {
  return getLabelBySlug(SHOW_LABEL_SLUG);
}

export async function ensureShowLabel() {
  const existing = await prisma.label.findUnique({
    where: { slug: SHOW_LABEL_SLUG },
  });

  if (existing) return existing;

  return prisma.label.create({
    data: { name: "Show", slug: SHOW_LABEL_SLUG },
  });
}

export async function ensureFeaturedLabel() {
  const existing = await prisma.label.findUnique({
    where: { slug: FEATURED_LABEL_SLUG },
  });

  if (existing) return existing;

  return prisma.label.create({
    data: { name: "Featured", slug: FEATURED_LABEL_SLUG },
  });
}

export async function ensureSystemLabels() {
  await Promise.all([ensureShowLabel(), ensureFeaturedLabel()]);
}

export function validateLabelSlug(slug: string): string | null {
  if (!slug) return "Slug is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug must use lowercase letters, numbers, and hyphens";
  }
  return null;
}

export function buildLabelSlug(name: string, slug?: string): string {
  return slugify(slug?.trim() || name);
}

export async function getLabelUsageCountsForSection(section: string) {
  await ensureSystemLabels();

  const rows = await prisma.projectLabel.groupBy({
    by: ["labelId"],
    where: { project: { section } },
    _count: { labelId: true },
  });

  const labels = await prisma.label.findMany({
    where: { id: { in: rows.map((row) => row.labelId) } },
  });

  const labelById = Object.fromEntries(labels.map((label) => [label.id, label]));

  return Object.fromEntries(
    rows.map((row) => [
      labelById[row.labelId]?.slug ?? row.labelId,
      row._count.labelId,
    ])
  ) as Record<string, number>;
}

export async function getLabelUsageCountsForTimeline() {
  await ensureSystemLabels();
  const showLabel = await ensureShowLabel();

  const rows = await prisma.projectLabel.groupBy({
    by: ["labelId"],
    where: {
      project: {
        labels: { some: { labelId: showLabel.id } },
      },
    },
    _count: { labelId: true },
  });

  const labels = await prisma.label.findMany({
    where: { id: { in: rows.map((row) => row.labelId) } },
  });

  const labelById = Object.fromEntries(labels.map((label) => [label.id, label]));

  return Object.fromEntries(
    rows.map((row) => [
      labelById[row.labelId]?.slug ?? row.labelId,
      row._count.labelId,
    ])
  ) as Record<string, number>;
}
