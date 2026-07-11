export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateSlug(
  slug: string,
  options?: { reserved?: Set<string> }
): string | null {
  if (!slug) return "Slug is required";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Slug must use lowercase letters, numbers, and hyphens";
  }
  if (options?.reserved?.has(slug)) {
    return "This slug is reserved";
  }
  return null;
}
