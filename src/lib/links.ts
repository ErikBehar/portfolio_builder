import type { ProjectLink } from "@/lib/types";

export function normalizeProjectLink(link: unknown): ProjectLink | null {
  if (!link || typeof link !== "object") return null;

  const record = link as Record<string, unknown>;
  const label = typeof record.label === "string" ? record.label.trim() : "";
  const url = typeof record.url === "string" ? record.url.trim() : "";

  if (!label || !url) return null;

  return {
    label,
    url,
    pulse: record.pulse === false ? false : true,
  };
}

export function parseLinks(links: string): ProjectLink[] {
  try {
    const parsed = JSON.parse(links);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeProjectLink)
      .filter((link): link is ProjectLink => link !== null);
  } catch {
    return [];
  }
}

export function sanitizeProjectLinks(links: unknown): ProjectLink[] {
  if (!Array.isArray(links)) return [];

  return links
    .map(normalizeProjectLink)
    .filter((link): link is ProjectLink => link !== null);
}

export function isProjectLinkPulsing(
  link: ProjectLink,
  globalEnabled: boolean
): boolean {
  return globalEnabled && link.pulse !== false;
}
