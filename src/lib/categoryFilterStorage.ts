const STORAGE_PREFIX = "portfolio:category-filters:";

export function readStoredCategoryFilterParam(scope: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${scope}`);
  } catch {
    return null;
  }
}

export function writeStoredCategoryFilterParam(
  scope: string,
  paramValue: string | null
) {
  if (typeof window === "undefined") return;

  try {
    const key = `${STORAGE_PREFIX}${scope}`;
    if (paramValue === null) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, paramValue);
  } catch {
    // Ignore quota / private-mode failures.
  }
}
