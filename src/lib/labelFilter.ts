export function projectMatchesLabels(
  project: { labels: { slug: string }[] },
  selectedSlugs: string[]
): boolean {
  if (selectedSlugs.length === 0) return false;
  const projectSlugs = new Set(project.labels.map((label) => label.slug));
  return selectedSlugs.some((slug) => projectSlugs.has(slug));
}
