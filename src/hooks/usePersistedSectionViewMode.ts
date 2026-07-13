"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  isSectionViewMode,
  readStoredSectionViewMode,
  writeStoredSectionViewMode,
  type SectionViewMode,
} from "@/lib/sectionViewStorage";

const DEFAULT_VIEW_MODE: SectionViewMode = "grid";

export function usePersistedSectionViewMode(scope: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didRestore = useRef(false);
  const urlParam = searchParams.get("view");

  const [mode, setModeState] = useState<SectionViewMode>(() =>
    isSectionViewMode(urlParam) ? urlParam : DEFAULT_VIEW_MODE
  );

  useEffect(() => {
    if (isSectionViewMode(urlParam)) {
      setModeState(urlParam);
      writeStoredSectionViewMode(scope, urlParam);
      return;
    }

    if (didRestore.current) return;
    didRestore.current = true;

    const stored = readStoredSectionViewMode(scope);
    if (!stored || stored === DEFAULT_VIEW_MODE) {
      setModeState(DEFAULT_VIEW_MODE);
      return;
    }

    setModeState(stored);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", stored);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, scope, searchParams, urlParam]);

  function setMode(next: SectionViewMode) {
    setModeState(next);
    writeStoredSectionViewMode(scope, next);

    const params = new URLSearchParams(searchParams.toString());
    if (next === DEFAULT_VIEW_MODE) {
      params.delete("view");
    } else {
      params.set("view", next);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return { mode, setMode };
}
