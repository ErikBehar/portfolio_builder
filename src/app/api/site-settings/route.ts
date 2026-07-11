import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { normalizeSectionColor } from "@/lib/sectionValidation";
import {
  DEFAULT_SITE_TITLE_COLOR,
  getSiteSettings,
  normalizeSiteColor,
  SITE_SETTINGS_ID,
  validateSiteSettingsInput,
} from "@/lib/siteSettings";

function toSiteSettingsResponse(settings: {
  id: string;
  title: string;
  description: string;
  footerText: string | null;
  commentsEnabled: boolean | null;
  projectCommentsEnabled: boolean | null;
  homeHeaderColor: string | null;
  siteTitleColor: string | null;
  updatedAt: Date;
}) {
  return {
    id: settings.id,
    title: settings.title,
    description: settings.description,
    footerText: settings.footerText ?? "",
    commentsEnabled: settings.commentsEnabled ?? true,
    projectCommentsEnabled: settings.projectCommentsEnabled ?? true,
    homeHeaderColor: normalizeSectionColor(
      settings.homeHeaderColor ?? undefined
    ),
    siteTitleColor: normalizeSiteColor(
      settings.siteTitleColor,
      DEFAULT_SITE_TITLE_COLOR
    ),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const validationError = validateSiteSettingsInput(body);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const homeHeaderColor = normalizeSectionColor(body.homeHeaderColor);
  const siteTitleColor = normalizeSiteColor(
    body.siteTitleColor,
    DEFAULT_SITE_TITLE_COLOR
  );

  const settings = await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: {
      id: SITE_SETTINGS_ID,
      title: body.title.trim(),
      description: body.description.trim(),
      footerText: typeof body.footerText === "string" ? body.footerText.trim() : "",
      commentsEnabled: body.commentsEnabled ?? true,
      projectCommentsEnabled: body.projectCommentsEnabled ?? true,
      homeHeaderColor,
      siteTitleColor,
    },
    update: {
      title: body.title.trim(),
      description: body.description.trim(),
      footerText: typeof body.footerText === "string" ? body.footerText.trim() : "",
      commentsEnabled: body.commentsEnabled ?? true,
      projectCommentsEnabled: body.projectCommentsEnabled ?? true,
      homeHeaderColor,
      siteTitleColor,
    },
  });

  return NextResponse.json(toSiteSettingsResponse(settings));
}
