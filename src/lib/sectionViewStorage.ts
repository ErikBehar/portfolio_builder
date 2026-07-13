export type SectionViewMode = "grid" | "list";

const STORAGE_PREFIX = "portfolio:section-view:";

export function isSectionViewMode(value: string | null | undefined): value is SectionViewMode {
  return value === "grid" || value === "list";
}

export function readStoredSectionViewMode(scope: string): SectionViewMode | null {
  if (typeof window === "undefined") return null;

  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${scope}`);
    return isSectionViewMode(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeStoredSectionViewMode(
  scope: string,
  mode: SectionViewMode
) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${scope}`, mode);
  } catch {
    // Ignore quota / private-mode failures.
  }
}
