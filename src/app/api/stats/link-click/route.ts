import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  checkRateLimit,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/rateLimit";
import { handleApiError } from "@/lib/apiRoute";
import { recordLinkClick } from "@/lib/stats";
import type { LinkSource } from "@/lib/statsTypes";
import { VISITOR_COOKIE_NAME } from "@/lib/visitorConstants";

export const STATS_LINK_CLICK_RATE_LIMIT = {
  limit: 60,
  windowMs: 60 * 1000,
};

const LINK_SOURCES = new Set<LinkSource>([
  "header",
  "footer",
  "project-links",
  "rich-text",
  "log-content",
]);

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(
      `stats-link-click:${ip}`,
      STATS_LINK_CLICK_RATE_LIMIT.limit,
      STATS_LINK_CLICK_RATE_LIMIT.windowMs
    );

    if (!rate.ok) {
      return rateLimitExceededResponse(rate.retryAfterSec);
    }

    const body = (await request.json()) as {
      url?: string;
      source?: string;
      sourcePath?: string;
      contextId?: string | null;
      label?: string | null;
    };

    if (!body.url || typeof body.url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!body.source || !LINK_SOURCES.has(body.source as LinkSource)) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const visitorId = cookieStore.get(VISITOR_COOKIE_NAME)?.value ?? null;

    await recordLinkClick({
      url: body.url,
      source: body.source as LinkSource,
      sourcePath:
        typeof body.sourcePath === "string" ? body.sourcePath : "/",
      contextId: body.contextId ?? null,
      label: body.label ?? null,
      visitorId,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
