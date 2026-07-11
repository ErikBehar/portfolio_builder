import { prisma } from "@/lib/db";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import {
  buildSectionSlug,
  isReservedSectionSlug,
  normalizeSectionColor,
  RESERVED_SECTION_SLUGS,
  validateSectionColor,
  validateSectionSlug,
} from "@/lib/sectionValidation";

export { DEFAULT_SECTION_COLOR };
export {
  buildSectionSlug,
  isReservedSectionSlug,
  normalizeSectionColor,
  RESERVED_SECTION_SLUGS,
  validateSectionColor,
  validateSectionSlug,
};

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

export async function getSectionTitle(slug: string): Promise<string> {
  const section = await getSection(slug);
  return section?.title ?? slug.replace(/-/g, " ");
}
