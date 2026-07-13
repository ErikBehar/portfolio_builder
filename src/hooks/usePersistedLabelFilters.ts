"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  encodeLabelFilterParam,
  parseLabelFilterParam,
  readStoredLabelFilterParam,
  writeStoredLabelFilterParam,
} from "@/lib/labelFilterStorage";

type UsePersistedLabelFiltersOptions = {
  /** Storage key scope, e.g. "timeline" or "section:video-games". */
  scope: string;
  /** Used when URL and storage have no saved filter. */
  defaultSlugs: string[];
  /**
   * When true, clearing all labels stores/uses `labels=none`.
   * When false (timeline), clearing means “show all” and drops the param.
   */
  emptyMeansNone: boolean;
};

export function usePersistedLabelFilters({
  scope,
  defaultSlugs,
  emptyMeansNone,
}: UsePersistedLabelFiltersOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didRestore = useRef(false);

  const urlParam = searchParams.get("labels");

  const selectedSlugs = useMemo(
    () => parseLabelFilterParam(urlParam, defaultSlugs),
    [urlParam, defaultSlugs]
  );

  useEffect(() => {
    if (didRestore.current) return;
    didRestore.current = true;

    // Explicit URL wins (shareable links).
    if (urlParam !== null) {
      writeStoredLabelFilterParam(scope, urlParam);
      return;
    }

    const stored = readStoredLabelFilterParam(scope);
    if (stored === null) return;

    const params = new URLSearchParams(searchParams.toString());
    if (stored === "none" || stored === "") {
      if (emptyMeansNone) {
        params.set("labels", "none");
      } else {
        params.delete("labels");
      }
    } else {
      params.set("labels", stored);
    }

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    const currentQuery = searchParams.toString();
    const currentUrl = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    if (nextUrl !== currentUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [emptyMeansNone, pathname, router, scope, searchParams, urlParam]);

  function setSelectedSlugs(next: string[]) {
    const encoded = encodeLabelFilterParam(next, emptyMeansNone);
    writeStoredLabelFilterParam(scope, encoded ?? (emptyMeansNone ? "none" : ""));

    const params = new URLSearchParams(searchParams.toString());
    if (encoded === null) {
      params.delete("labels");
    } else {
      params.set("labels", encoded);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function toggleLabel(slug: string) {
    const next = selectedSlugs.includes(slug)
      ? selectedSlugs.filter((entry) => entry !== slug)
      : [...selectedSlugs, slug];
    setSelectedSlugs(next);
  }

  return { selectedSlugs, toggleLabel, setSelectedSlugs };
}
