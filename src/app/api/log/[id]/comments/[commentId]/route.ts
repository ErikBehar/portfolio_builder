import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { handleApiError } from "@/lib/apiRoute";
import type { CommentRouteContext } from "@/lib/apiTypes";
import { deleteComment, updateComment } from "@/lib/comments";

export async function PUT(request: Request, context: CommentRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id, commentId } = await context.params;
    const body = await request.json();
    const comment = await updateComment("log", id, commentId, body);
    return NextResponse.json(comment);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: CommentRouteContext) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const { id, commentId } = await context.params;
    await deleteComment("log", id, commentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
