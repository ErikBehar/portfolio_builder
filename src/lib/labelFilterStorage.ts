const STORAGE_PREFIX = "portfolio:label-filters:";

export function readStoredLabelFilterParam(scope: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${scope}`);
  } catch {
    return null;
  }
}

export function writeStoredLabelFilterParam(
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

/** Encode selected slugs the same way the URL `labels` query param does. */
export function encodeLabelFilterParam(
  slugs: string[],
  emptyMeansNone: boolean
): string | null {
  if (slugs.length === 0) {
    return emptyMeansNone ? "none" : null;
  }
  return slugs.join(",");
}

export function parseLabelFilterParam(
  param: string | null,
  defaultSlugs: string[]
): string[] {
  if (param === "none") return [];
  if (param) return param.split(",").filter(Boolean);
  return defaultSlugs;
}
