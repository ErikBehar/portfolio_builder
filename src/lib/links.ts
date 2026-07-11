import type { ProjectLink } from "@/lib/types";

export function parseLinks(links: string): ProjectLink[] {
  try {
    const parsed = JSON.parse(links);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
