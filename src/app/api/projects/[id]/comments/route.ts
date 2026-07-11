import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiRoute";
import type { IdRouteContext } from "@/lib/apiTypes";
import { createComment, getComments } from "@/lib/comments";

export async function GET(_request: Request, context: IdRouteContext) {
  const { id } = await context.params;
  const comments = await getComments("project", id);
  return NextResponse.json(comments);
}

export async function POST(request: Request, context: IdRouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const comment = await createComment("project", id, body);
    return NextResponse.json(comment);
  } catch (error) {
    return handleApiError(error);
  }
}
