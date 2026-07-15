import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
import { slugify, validateSlug } from "@/lib/slug";
import { FEATURED_LABEL_SLUG, SHOW_LABEL_SLUG } from "@/lib/types";
import type { ProjectLabel } from "@/lib/types";
import {
  ensureSectionLabelsBackfilled,
  isSectionLabelSlug,
} from "@/lib/sectionLabels";

type LabelRecord = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

function toLabel(record: LabelRecord): ProjectLabel & { createdAt: string } {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    createdAt: record.createdAt.toISOString(),
  };
}

export async function getLabels() {
  await ensureSystemLabels();
  await ensureSectionLabelsBackfilled();

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
  return validateSlug(slug);
}

export function buildLabelSlug(name: string, slug?: string): string {
  return slugify(slug?.trim() || name);
}

export async function createLabel(body: { name?: string; slug?: string }) {
  if (!body.name?.trim()) {
    throw new ApiError("Name is required", 400);
  }

  const slug = buildLabelSlug(body.name, body.slug);
  const slugError = validateLabelSlug(slug);
  if (slugError) {
    throw new ApiError(slugError, 400);
  }

  const existing = await prisma.label.findUnique({ where: { slug } });
  if (existing) {
    throw new ApiError("A label with this slug already exists", 409);
  }

  if (await isSectionLabelSlug(slug)) {
    throw new ApiError(
      "This slug is reserved for a section label. Edit the section instead.",
      409
    );
  }

  const label = await prisma.label.create({
    data: {
      name: body.name.trim(),
      slug,
    },
  });

  return toLabel(label);
}

export async function updateLabel(
  id: string,
  body: { name?: string; slug?: string }
) {
  const existing = await prisma.label.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Label not found", 404);
  }

  if (await isSectionLabelSlug(existing.slug)) {
    throw new ApiError(
      "Section labels are managed automatically. Edit the section title instead.",
      400
    );
  }

  if (!body.name?.trim()) {
    throw new ApiError("Name is required", 400);
  }

  const slug = buildLabelSlug(body.name, body.slug);
  const slugError = validateLabelSlug(slug);
  if (slugError) {
    throw new ApiError(slugError, 400);
  }

  const conflict = await prisma.label.findFirst({
    where: { slug, NOT: { id } },
  });
  if (conflict) {
    throw new ApiError("A label with this slug already exists", 409);
  }

  const label = await prisma.label.update({
    where: { id },
    data: {
      name: body.name.trim(),
      slug,
    },
  });

  return toLabel(label);
}

export async function deleteLabel(id: string) {
  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) {
    throw new ApiError("Label not found", 404);
  }

  if (label.slug === SHOW_LABEL_SLUG) {
    throw new ApiError("The default show label cannot be deleted", 400);
  }

  if (await isSectionLabelSlug(label.slug)) {
    throw new ApiError(
      "Section labels are managed automatically. Delete the section instead.",
      400
    );
  }

  await prisma.label.delete({ where: { id } });
}

async function getLabelUsageCounts(
  where?: Parameters<typeof prisma.projectLabel.groupBy>[0]["where"]
) {
  await ensureSystemLabels();

  const rows = await prisma.projectLabel.groupBy({
    by: ["labelId"],
    where,
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

export async function getLabelUsageCountsForSection(section: string) {
  return getLabelUsageCounts({ project: { section } });
}

export async function getLabelUsageCountsForTimeline() {
  return getLabelUsageCounts();
}
