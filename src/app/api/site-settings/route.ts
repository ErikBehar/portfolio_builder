import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import { getSiteSettings, upsertSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const settings = await upsertSiteSettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    return handleApiError(error);
  }
}
