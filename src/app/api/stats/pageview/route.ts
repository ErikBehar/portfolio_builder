import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiRoute";
import { recordPageView } from "@/lib/stats";
import {
  VISITOR_COOKIE_MAX_AGE,
  VISITOR_COOKIE_NAME,
} from "@/lib/visitorConstants";

export const STATS_PAGE_VIEW_RATE_LIMIT = {
  limit: 120,
  windowMs: 60 * 1000,
};

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(
      `stats-pageview:${ip}`,
      STATS_PAGE_VIEW_RATE_LIMIT.limit,
      STATS_PAGE_VIEW_RATE_LIMIT.windowMs
    );

    if (!rate.ok) {
      return rateLimitExceededResponse(rate.retryAfterSec);
    }

    const body = (await request.json()) as {
      path?: string;
      referrer?: string | null;
    };

    if (!body.path || typeof body.path !== "string") {
      return NextResponse.json({ error: "Path is required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const existingVisitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value?.trim();
    const visitorId = existingVisitorId || randomUUID();
    const host = request.headers.get("host");

    await recordPageView({
      path: body.path,
      visitorId,
      referrer: body.referrer,
      host,
    });

    const response = NextResponse.json({ ok: true });

    if (!existingVisitorId) {
      response.cookies.set(VISITOR_COOKIE_NAME, visitorId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: VISITOR_COOKIE_MAX_AGE,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
