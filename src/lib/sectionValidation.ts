import { slugify } from "@/lib/db";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";

export const RESERVED_SECTION_SLUGS = new Set([
  "admin",
  "api",
  "log",
  "sections",
  "timeline",
  "uploads",
]);

export function isReservedSectionSlug(slug: string): boolean {
  return RESERVED_SECTION_SLUGS.has(slug);
}

export function validateSectionSlug(slug: string): string | null {
  if (!slug) return "Slug is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug must use lowercase letters, numbers, and hyphens";
  }
  if (isReservedSectionSlug(slug)) {
    return "This slug is reserved";
  }
  return null;
}

export function buildSectionSlug(title: string, slug?: string): string {
  return slugify(slug?.trim() || title);
}

export function validateSectionColor(color: string): string | null {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    return "Color must be a hex value like #5b9fd4";
  }
  return null;
}

export function normalizeSectionColor(color?: string): string {
  const value = color?.trim() || DEFAULT_SECTION_COLOR;
  return validateSectionColor(value) ? DEFAULT_SECTION_COLOR : value.toLowerCase();
}
