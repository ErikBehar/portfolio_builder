import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiRoute";
import { createCommentCaptcha } from "@/lib/commentCaptcha";
import {
  COMMENT_CAPTCHA_RATE_LIMIT,
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    const limited = checkRateLimit(
      `comment-captcha:${ip}`,
      COMMENT_CAPTCHA_RATE_LIMIT.limit,
      COMMENT_CAPTCHA_RATE_LIMIT.windowMs
    );
    if (!limited.ok) {
      return rateLimitExceededResponse(limited.retryAfterSec);
    }

    return NextResponse.json(createCommentCaptcha());
  } catch (error) {
    return handleApiError(error);
  }
}
