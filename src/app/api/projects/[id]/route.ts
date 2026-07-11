import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import type { IdRouteContext } from "@/lib/apiTypes";
import {
  deleteProject,
  getProjectById,
  updateProject,
} from "@/lib/projects";

export async function GET(_request: Request, context: IdRouteContext) {
  const { id } = await context.params;
  const project = await getProjectById(id);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PUT(request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const body = await request.json();
    const project = await updateProject(id, body);
    return NextResponse.json(project);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: IdRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    await deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
