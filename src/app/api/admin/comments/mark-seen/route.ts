import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { markCommentsSeen } from "@/lib/adminComments";
import { handleApiError } from "@/lib/apiRoute";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    const result = await markCommentsSeen({
      all: body?.all === true,
      items: Array.isArray(body?.items) ? body.items : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
