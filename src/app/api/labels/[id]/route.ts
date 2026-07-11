import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import type { IdRouteContext } from "@/lib/apiTypes";
import { deleteLabel, getLabelById, updateLabel } from "@/lib/labels";

export async function GET(_request: Request, context: IdRouteContext) {
  const { id } = await context.params;
  const label = await getLabelById(id);

  if (!label) {
    return NextResponse.json({ error: "Label not found" }, { status: 404 });
  }

  return NextResponse.json(label);
}

export async function PUT(request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const label = await updateLabel(id, body);
    return NextResponse.json(label);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    await deleteLabel(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
