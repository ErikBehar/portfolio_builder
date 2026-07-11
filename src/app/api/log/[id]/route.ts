import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import type { IdRouteContext } from "@/lib/apiTypes";
import {
  deleteLogEntry,
  getLogEntryById,
  updateLogEntry,
} from "@/lib/log";

export async function GET(_request: Request, context: IdRouteContext) {
  const { id } = await context.params;
  const entry = await getLogEntryById(id);

  if (!entry) {
    return NextResponse.json({ error: "Log entry not found" }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const entry = await updateLogEntry(id, body);
    return NextResponse.json(entry);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    await deleteLogEntry(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
