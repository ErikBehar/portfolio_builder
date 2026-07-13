export const HOME_SECTION_IDS = [
  "log",
  "featured",
  "projects",
  "timeline",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

export type TimelineDisplayMode = "link" | "embed";

export type HomeSectionConfig = {
  id: HomeSectionId;
  visible: boolean;
};

export type HomeLayout = {
  sections: HomeSectionConfig[];
  timelineMode: TimelineDisplayMode;
};

export const HOME_SECTION_LABELS: Record<HomeSectionId, string> = {
  log: "Log preview",
  featured: "Featured projects",
  projects: "Project sections",
  timeline: "Timeline",
};

export const DEFAULT_HOME_LAYOUT: HomeLayout = {
  sections: [
    { id: "log", visible: true },
    { id: "featured", visible: true },
    { id: "projects", visible: true },
    { id: "timeline", visible: true },
  ],
  timelineMode: "link",
};

function isHomeSectionId(value: unknown): value is HomeSectionId {
  return (
    typeof value === "string" &&
    (HOME_SECTION_IDS as readonly string[]).includes(value)
  );
}

function isTimelineDisplayMode(value: unknown): value is TimelineDisplayMode {
  return value === "link" || value === "embed";
}

export function parseHomeLayout(raw: string | null | undefined): HomeLayout {
  if (!raw) return structuredClone(DEFAULT_HOME_LAYOUT);

  try {
    const parsed = JSON.parse(raw) as Partial<HomeLayout>;
    const timelineMode = isTimelineDisplayMode(parsed.timelineMode)
      ? parsed.timelineMode
      : DEFAULT_HOME_LAYOUT.timelineMode;

    const seen = new Set<HomeSectionId>();
    const sections: HomeSectionConfig[] = [];

    if (Array.isArray(parsed.sections)) {
      for (const entry of parsed.sections) {
        if (!entry || typeof entry !== "object") continue;
        const id = (entry as { id?: unknown }).id;
        if (!isHomeSectionId(id) || seen.has(id)) continue;
        seen.add(id);
        sections.push({
          id,
          visible: Boolean((entry as { visible?: unknown }).visible),
        });
      }
    }

    for (const id of HOME_SECTION_IDS) {
      if (!seen.has(id)) {
        const fallback = DEFAULT_HOME_LAYOUT.sections.find(
          (section) => section.id === id
        )!;
        sections.push({ ...fallback });
      }
    }

    return { sections, timelineMode };
  } catch {
    return structuredClone(DEFAULT_HOME_LAYOUT);
  }
}

export function serializeHomeLayout(layout: HomeLayout): string {
  return JSON.stringify(layout);
}

export function validateHomeLayoutInput(
  body: unknown
): HomeLayout | string {
  if (!body || typeof body !== "object") {
    return "Home layout must be an object";
  }

  const value = body as Partial<HomeLayout>;
  if (!isTimelineDisplayMode(value.timelineMode)) {
    return "Timeline display must be link or embed";
  }

  if (!Array.isArray(value.sections) || value.sections.length === 0) {
    return "Home sections are required";
  }

  const seen = new Set<HomeSectionId>();
  const sections: HomeSectionConfig[] = [];

  for (const entry of value.sections) {
    if (!entry || typeof entry !== "object") {
      return "Each home section must be an object";
    }
    if (!isHomeSectionId(entry.id)) {
      return "Invalid home section id";
    }
    if (seen.has(entry.id)) {
      return "Duplicate home section id";
    }
    if (typeof entry.visible !== "boolean") {
      return "Home section visibility must be true or false";
    }
    seen.add(entry.id);
    sections.push({ id: entry.id, visible: entry.visible });
  }

  for (const id of HOME_SECTION_IDS) {
    if (!seen.has(id)) {
      return `Missing home section: ${id}`;
    }
  }

  return { sections, timelineMode: value.timelineMode };
}
