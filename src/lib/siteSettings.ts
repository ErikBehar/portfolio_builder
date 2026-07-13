import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
import {
  DEFAULT_HOME_LAYOUT,
  parseHomeLayout,
  serializeHomeLayout,
  validateHomeLayoutInput,
  type HomeLayout,
} from "@/lib/homeLayout";
import { DEFAULT_SITE_TITLE_COLOR } from "@/lib/siteConstants";
import { DEFAULT_SECTION_COLOR } from "@/lib/sectionConstants";
import { normalizeSectionColor, validateSectionColor } from "@/lib/sectionValidation";

export const SITE_SETTINGS_ID = "default";

export const DEFAULT_SITE_SETTINGS = {
  title: "Your Name's Portfolio",
  description: "A professional portfolio.",
  footerText: "",
  commentsEnabled: true,
  projectCommentsEnabled: true,
  commentsVisible: true,
  projectCommentsVisible: true,
  homeHeaderColor: DEFAULT_SECTION_COLOR,
  siteTitleColor: DEFAULT_SITE_TITLE_COLOR,
  homeLayout: DEFAULT_HOME_LAYOUT,
};

export type SiteSettings = {
  id: string;
  title: string;
  description: string;
  footerText: string;
  commentsEnabled: boolean;
  projectCommentsEnabled: boolean;
  commentsVisible: boolean;
  projectCommentsVisible: boolean;
  homeHeaderColor: string;
  siteTitleColor: string;
  homeLayout: HomeLayout;
  updatedAt: string;
};

export function validateSiteSettingsInput(body: {
  title?: string;
  description?: string;
  footerText?: string;
  commentsEnabled?: boolean;
  projectCommentsEnabled?: boolean;
  commentsVisible?: boolean;
  projectCommentsVisible?: boolean;
  homeHeaderColor?: string;
  siteTitleColor?: string;
  homeLayout?: unknown;
}): string | null {
  if (!body.title?.trim()) return "Site title is required";
  if (!body.description?.trim()) return "Site description is required";
  if (body.footerText !== undefined && typeof body.footerText !== "string") {
    return "Footer text must be a string";
  }
  if (
    body.commentsEnabled !== undefined &&
    typeof body.commentsEnabled !== "boolean"
  ) {
    return "Comments enabled must be true or false";
  }
  if (
    body.projectCommentsEnabled !== undefined &&
    typeof body.projectCommentsEnabled !== "boolean"
  ) {
    return "Project comments enabled must be true or false";
  }
  if (
    body.commentsVisible !== undefined &&
    typeof body.commentsVisible !== "boolean"
  ) {
    return "Comments visible must be true or false";
  }
  if (
    body.projectCommentsVisible !== undefined &&
    typeof body.projectCommentsVisible !== "boolean"
  ) {
    return "Project comments visible must be true or false";
  }
  if (body.homeHeaderColor !== undefined && body.homeHeaderColor.trim()) {
    const colorError = validateSectionColor(body.homeHeaderColor.trim());
    if (colorError) return colorError;
  }
  if (body.siteTitleColor !== undefined && body.siteTitleColor.trim()) {
    const colorError = validateSectionColor(body.siteTitleColor.trim());
    if (colorError) return colorError;
  }
  if (body.homeLayout !== undefined) {
    const layout = validateHomeLayoutInput(body.homeLayout);
    if (typeof layout === "string") return layout;
  }
  return null;
}

export function normalizeSiteColor(
  color: string | null | undefined,
  fallback: string
): string {
  const value = color?.trim() || fallback;
  return validateSectionColor(value) ? fallback.toLowerCase() : value.toLowerCase();
}

export async function ensureDefaultSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });

  if (existing) {
    const needsBackfill =
      existing.footerText == null ||
      existing.commentsEnabled == null ||
      existing.projectCommentsEnabled == null ||
      existing.commentsVisible == null ||
      existing.projectCommentsVisible == null ||
      existing.homeHeaderColor == null ||
      existing.siteTitleColor == null ||
      existing.homeLayout == null;

    if (needsBackfill) {
      await prisma.siteSettings.update({
        where: { id: SITE_SETTINGS_ID },
        data: {
          footerText: existing.footerText ?? DEFAULT_SITE_SETTINGS.footerText,
          commentsEnabled:
            existing.commentsEnabled ?? DEFAULT_SITE_SETTINGS.commentsEnabled,
          projectCommentsEnabled:
            existing.projectCommentsEnabled ??
            DEFAULT_SITE_SETTINGS.projectCommentsEnabled,
          commentsVisible:
            existing.commentsVisible ?? DEFAULT_SITE_SETTINGS.commentsVisible,
          projectCommentsVisible:
            existing.projectCommentsVisible ??
            DEFAULT_SITE_SETTINGS.projectCommentsVisible,
          homeHeaderColor:
            existing.homeHeaderColor ?? DEFAULT_SITE_SETTINGS.homeHeaderColor,
          siteTitleColor:
            existing.siteTitleColor ?? DEFAULT_SITE_SETTINGS.siteTitleColor,
          homeLayout:
            existing.homeLayout ??
            serializeHomeLayout(DEFAULT_SITE_SETTINGS.homeLayout),
        },
      });
    }

    return;
  }

  await prisma.siteSettings.create({
    data: {
      id: SITE_SETTINGS_ID,
      title: DEFAULT_SITE_SETTINGS.title,
      description: DEFAULT_SITE_SETTINGS.description,
      footerText: DEFAULT_SITE_SETTINGS.footerText,
      commentsEnabled: DEFAULT_SITE_SETTINGS.commentsEnabled,
      projectCommentsEnabled: DEFAULT_SITE_SETTINGS.projectCommentsEnabled,
      commentsVisible: DEFAULT_SITE_SETTINGS.commentsVisible,
      projectCommentsVisible: DEFAULT_SITE_SETTINGS.projectCommentsVisible,
      homeHeaderColor: DEFAULT_SITE_SETTINGS.homeHeaderColor,
      siteTitleColor: DEFAULT_SITE_SETTINGS.siteTitleColor,
      homeLayout: serializeHomeLayout(DEFAULT_SITE_SETTINGS.homeLayout),
    },
  });
}

export async function getSiteSettings(): Promise<SiteSettings> {
  noStore();
  await ensureDefaultSiteSettings();

  const settings = await prisma.siteSettings.findUniqueOrThrow({
    where: { id: SITE_SETTINGS_ID },
  });

  return {
    id: settings.id,
    title: settings.title,
    description: settings.description,
    footerText: settings.footerText ?? DEFAULT_SITE_SETTINGS.footerText,
    commentsEnabled:
      settings.commentsEnabled ?? DEFAULT_SITE_SETTINGS.commentsEnabled,
    projectCommentsEnabled:
      settings.projectCommentsEnabled ??
      DEFAULT_SITE_SETTINGS.projectCommentsEnabled,
    commentsVisible:
      settings.commentsVisible ?? DEFAULT_SITE_SETTINGS.commentsVisible,
    projectCommentsVisible:
      settings.projectCommentsVisible ??
      DEFAULT_SITE_SETTINGS.projectCommentsVisible,
    homeHeaderColor: normalizeSectionColor(
      settings.homeHeaderColor ?? DEFAULT_SITE_SETTINGS.homeHeaderColor
    ),
    siteTitleColor: normalizeSiteColor(
      settings.siteTitleColor,
      DEFAULT_SITE_SETTINGS.siteTitleColor
    ),
    homeLayout: parseHomeLayout(settings.homeLayout),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function upsertSiteSettings(body: {
  title?: string;
  description?: string;
  footerText?: string;
  commentsEnabled?: boolean;
  projectCommentsEnabled?: boolean;
  commentsVisible?: boolean;
  projectCommentsVisible?: boolean;
  homeHeaderColor?: string;
  siteTitleColor?: string;
  homeLayout?: unknown;
}): Promise<SiteSettings> {
  const validationError = validateSiteSettingsInput(body);
  if (validationError) {
    throw new ApiError(validationError, 400);
  }

  const homeHeaderColor = normalizeSectionColor(body.homeHeaderColor);
  const siteTitleColor = normalizeSiteColor(
    body.siteTitleColor,
    DEFAULT_SITE_TITLE_COLOR
  );
  const homeLayoutResult =
    body.homeLayout !== undefined
      ? validateHomeLayoutInput(body.homeLayout)
      : DEFAULT_SITE_SETTINGS.homeLayout;
  if (typeof homeLayoutResult === "string") {
    throw new ApiError(homeLayoutResult, 400);
  }
  const homeLayout = serializeHomeLayout(homeLayoutResult);

  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: {
      id: SITE_SETTINGS_ID,
      title: body.title!.trim(),
      description: body.description!.trim(),
      footerText:
        typeof body.footerText === "string" ? body.footerText.trim() : "",
      commentsEnabled: body.commentsEnabled ?? true,
      projectCommentsEnabled: body.projectCommentsEnabled ?? true,
      commentsVisible: body.commentsVisible ?? true,
      projectCommentsVisible: body.projectCommentsVisible ?? true,
      homeHeaderColor,
      siteTitleColor,
      homeLayout,
    },
    update: {
      title: body.title!.trim(),
      description: body.description!.trim(),
      footerText:
        typeof body.footerText === "string" ? body.footerText.trim() : "",
      commentsEnabled: body.commentsEnabled ?? true,
      projectCommentsEnabled: body.projectCommentsEnabled ?? true,
      commentsVisible: body.commentsVisible ?? true,
      projectCommentsVisible: body.projectCommentsVisible ?? true,
      homeHeaderColor,
      siteTitleColor,
      homeLayout,
    },
  });

  return getSiteSettings();
}
