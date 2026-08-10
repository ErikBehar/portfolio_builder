import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import {
  createHeaderLinkCustomIcon,
  getHeaderLinkCustomIcons,
} from "@/lib/headerLinks";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const icons = await getHeaderLinkCustomIcons();
    return NextResponse.json(icons);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const icon = await createHeaderLinkCustomIcon(body);
    return NextResponse.json(icon);
  } catch (error) {
    return handleApiError(error);
  }
}
