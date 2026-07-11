import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import type { IdRouteContext } from "@/lib/apiTypes";
import {
  deleteHeaderLink,
  getHeaderLinkById,
  updateHeaderLink,
} from "@/lib/headerLinks";

export async function GET(_request: Request, context: IdRouteContext) {
  const { id } = await context.params;
  const link = await getHeaderLinkById(id);

  if (!link) {
    return NextResponse.json({ error: "Header link not found" }, { status: 404 });
  }

  return NextResponse.json(link);
}

export async function PUT(request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const link = await updateHeaderLink(id, body);
    return NextResponse.json(link);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    await deleteHeaderLink(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
