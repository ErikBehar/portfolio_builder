import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiRoute";
import type { IdRouteContext } from "@/lib/apiTypes";
import { createComment, getComments } from "@/lib/comments";
import {
  COMMENT_RATE_LIMIT,
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rateLimit";

export async function GET(_request: Request, context: IdRouteContext) {
  const { id } = await context.params;
  const comments = await getComments("log", id);
  return NextResponse.json(comments);
}

export async function POST(request: Request, context: IdRouteContext) {
  try {
    const ip = getClientIp(request);
    const limited = checkRateLimit(
      `comment:${ip}`,
      COMMENT_RATE_LIMIT.limit,
      COMMENT_RATE_LIMIT.windowMs
    );
    if (!limited.ok) {
      return rateLimitExceededResponse(limited.retryAfterSec);
    }

    const { id } = await context.params;
    const body = await request.json();
    const comment = await createComment("log", id, body);
    return NextResponse.json(comment);
  } catch (error) {
    return handleApiError(error);
  }
}
