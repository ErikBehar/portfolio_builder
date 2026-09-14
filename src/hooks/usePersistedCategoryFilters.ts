"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  readStoredCategoryFilterParam,
  writeStoredCategoryFilterParam,
} from "@/lib/categoryFilterStorage";
import { encodeLabelFilterParam } from "@/lib/labelFilterStorage";

const CHANGE_EVENT = "portfolio-category-filters";

function subscribe(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key?.startsWith("portfolio:category-filters:")) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

function parseStored(stored: string | null, known: string[]): string[] {
  if (stored === null) return known;
  if (stored === "none") return [];

  const parsed = stored.split(",").filter(Boolean);
  const valid = parsed.filter((slug) => known.includes(slug));
  return valid.length > 0 ? valid : known;
}

export function usePersistedCategoryFilters(
  scope: string,
  categorySlugs: string[]
) {
  const getClientSnapshot = useCallback(
    () => readStoredCategoryFilterParam(scope),
    [scope]
  );

  const stored = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => null
  );

  const selectedSlugs = useMemo(
    () => parseStored(stored, categorySlugs),
    [stored, categorySlugs]
  );

  function commit(next: string[]) {
    const allSelected =
      categorySlugs.length > 0 &&
      next.length === categorySlugs.length &&
      categorySlugs.every((slug) => next.includes(slug));

    writeStoredCategoryFilterParam(
      scope,
      allSelected ? null : encodeLabelFilterParam(next, true) ?? "none"
    );
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  function toggleCategory(slug: string) {
    const next = selectedSlugs.includes(slug)
      ? selectedSlugs.filter((entry) => entry !== slug)
      : [...selectedSlugs, slug];
    commit(next);
  }

  function showAllCategories() {
    commit(categorySlugs);
  }

  return { selectedSlugs, toggleCategory, showAllCategories };
}
