import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/apiRoute";
import { ApiError } from "@/lib/apiErrors";
import { createCommentCaptcha } from "@/lib/commentCaptcha";
import { getSiteSettings } from "@/lib/siteSettings";
import {
  COMMENT_CAPTCHA_RATE_LIMIT,
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const siteSettings = await getSiteSettings();
    if (!siteSettings.commentCaptchaEnabled) {
      throw new ApiError("Comment captcha is currently disabled", 403);
    }

    const ip = getClientIp(request);
    const limited = checkRateLimit(
      `comment-captcha:${ip}`,
      COMMENT_CAPTCHA_RATE_LIMIT.limit,
      COMMENT_CAPTCHA_RATE_LIMIT.windowMs
    );
    if (!limited.ok) {
      return rateLimitExceededResponse(limited.retryAfterSec);
    }

    return NextResponse.json(createCommentCaptcha(), {
      headers: {
        "Cache-Control": "no-store, no-cache, max-age=0",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
