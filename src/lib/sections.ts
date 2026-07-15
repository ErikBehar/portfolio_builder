import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
import {
  deleteSectionLabel,
  ensureSectionLabelsBackfilled,
  syncSectionLabelForSection,
  updateSectionLabelMetadata,
} from "@/lib/sectionLabels";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import {
  buildSectionSlug,
  normalizeSectionColor,
  validateSectionColor,
  validateSectionSlug,
} from "@/lib/sectionValidation";

export type SectionCategory = {
  slug: string;
  title: string;
};

export type Section = {
  id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  categories?: SectionCategory[];
  sortOrder: number;
};

type SectionRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  color: string;
  categories: string;
  sortOrder: number;
};

export function parseCategories(categories: string): SectionCategory[] {
  try {
    const parsed = JSON.parse(categories);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toSection(record: SectionRecord): Section {
  const categories = parseCategories(record.categories);

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    description: record.description,
    color: record.color || DEFAULT_SECTION_COLOR,
    sortOrder: record.sortOrder,
    ...(categories.length > 0 ? { categories } : {}),
  };
}

export async function getSections(): Promise<Section[]> {
  await ensureSectionLabelsBackfilled();

  const sections = await prisma.portfolioSection.findMany({
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return sections.map(toSection);
}

export async function getSection(slug: string): Promise<Section | null> {
  const section = await prisma.portfolioSection.findUnique({
    where: { slug },
  });

  if (!section) return null;
  return toSection(section);
}

export async function getSectionById(id: string): Promise<Section | null> {
  const section = await prisma.portfolioSection.findUnique({
    where: { id },
  });

  if (!section) return null;
  return toSection(section);
}

export type SectionInput = {
  title?: string;
  slug?: string;
  description?: string;
  color?: string;
  categories?: SectionCategory[];
  sortOrder?: number;
};

function validateSectionInput(body: SectionInput) {
  if (!body.title?.trim()) {
    throw new ApiError("Title is required", 400);
  }

  if (!body.description?.trim()) {
    throw new ApiError("Description is required", 400);
  }

  const slug = buildSectionSlug(body.title, body.slug);
  const slugError = validateSectionSlug(slug);
  if (slugError) {
    throw new ApiError(slugError, 400);
  }

  const color = normalizeSectionColor(body.color);
  const colorError = validateSectionColor(color);
  if (colorError) {
    throw new ApiError(colorError, 400);
  }

  return {
    title: body.title.trim(),
    slug,
    description: body.description.trim(),
    color,
    categories: JSON.stringify(body.categories ?? []),
    sortOrder: body.sortOrder ?? 0,
  };
}

export async function createSection(body: SectionInput) {
  const input = validateSectionInput(body);

  const existing = await prisma.portfolioSection.findUnique({
    where: { slug: input.slug },
  });
  if (existing) {
    throw new ApiError("A section with this slug already exists", 409);
  }

  const section = await prisma.portfolioSection.create({ data: input });
  await syncSectionLabelForSection(section.slug, section.title);
  return toSection(section);
}

export async function updateSection(id: string, body: SectionInput) {
  const existing = await prisma.portfolioSection.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Section not found", 404);
  }

  const input = validateSectionInput(body);

  const conflict = await prisma.portfolioSection.findFirst({
    where: { slug: input.slug, NOT: { id } },
  });
  if (conflict) {
    throw new ApiError("A section with this slug already exists", 409);
  }

  const section = await prisma.portfolioSection.update({
    where: { id },
    data: input,
  });

  if (existing.slug !== input.slug) {
    await prisma.project.updateMany({
      where: { section: existing.slug },
      data: { section: input.slug },
    });
  }

  await updateSectionLabelMetadata(existing.slug, input.slug, input.title);

  return toSection(section);
}

export async function deleteSection(id: string) {
  const section = await prisma.portfolioSection.findUnique({ where: { id } });
  if (!section) {
    throw new ApiError("Section not found", 404);
  }

  const projectCount = await prisma.project.count({
    where: { section: section.slug },
  });

  if (projectCount > 0) {
    throw new ApiError(
      `This section has ${projectCount} project(s). Delete them first.`,
      409
    );
  }

  await prisma.portfolioSection.delete({ where: { id } });
  await deleteSectionLabel(section.slug);
}
