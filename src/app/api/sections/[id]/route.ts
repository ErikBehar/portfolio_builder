import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import type { IdRouteContext } from "@/lib/apiTypes";
import {
  deleteSection,
  getSectionById,
  updateSection,
} from "@/lib/sections";

export async function GET(_request: Request, context: IdRouteContext) {
  const { id } = await context.params;
  const section = await getSectionById(id);

  if (!section) {
    return NextResponse.json({ error: "Section not found" }, { status: 404 });
  }

  return NextResponse.json(section);
}

export async function PUT(request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const section = await updateSection(id, body);
    return NextResponse.json(section);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    await deleteSection(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
