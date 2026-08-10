import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import {
  normalizeHeaderLinkIconSize,
  validateHeaderLinkIconSize,
} from "@/lib/headerLinkIcons";
import { ApiError } from "@/lib/apiErrors";
import { prisma } from "@/lib/db";
import {
  SITE_SETTINGS_ID,
  ensureDefaultSiteSettings,
  getSiteSettings,
} from "@/lib/siteSettings";

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const size =
      typeof body?.headerLinkIconSize === "string"
        ? body.headerLinkIconSize.trim()
        : "";
    const error = validateHeaderLinkIconSize(size);
    if (error) {
      throw new ApiError(error, 400);
    }

    await ensureDefaultSiteSettings();
    await prisma.siteSettings.update({
      where: { id: SITE_SETTINGS_ID },
      data: { headerLinkIconSize: normalizeHeaderLinkIconSize(size) },
    });

    const settings = await getSiteSettings();
    return NextResponse.json({
      headerLinkIconSize: settings.headerLinkIconSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
