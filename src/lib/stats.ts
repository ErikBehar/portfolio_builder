import { prisma } from "@/lib/db";
import type { LinkSource, PageType } from "@/lib/statsTypes";
import { isTrackableExternalUrl } from "@/lib/statsTypes";

export type { LinkSource, PageType } from "@/lib/statsTypes";
export { isTrackableExternalUrl } from "@/lib/statsTypes";

export type ParsedPath = {
  path: string;
  pageType: PageType;
  resourceSlug?: string;
  sectionSlug?: string;
};

export type RecordPageViewInput = {
  path: string;
  visitorId: string;
  referrer?: string | null;
  host?: string | null;
};

export type RecordLinkClickInput = {
  url: string;
  source: LinkSource;
  sourcePath: string;
  contextId?: string | null;
  label?: string | null;
  visitorId?: string | null;
};

export type StatsSummary = {
  uniqueVisitors: number;
  uniqueVisitorsToday: number;
  pageViewsLast30Days: number;
  linkClicksLast30Days: number;
  referrers: Array<{ referrer: string; views: number }>;
  logPages: Array<{
    path: string;
    slug: string;
    title: string;
    views: number;
    uniqueViews: number;
  }>;
  projectPages: Array<{
    path: string;
    sectionSlug: string;
    slug: string;
    title: string;
    views: number;
    uniqueViews: number;
  }>;
  linkClicks: Array<{
    url: string;
    source: string;
    label: string | null;
    clicks: number;
  }>;
  logLinkClicks: Array<{
    entryTitle: string;
    url: string;
    label: string | null;
    clicks: number;
  }>;
  dailyPageViews: Array<{ date: string; views: number; uniqueViews: number }>;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function parsePathForStats(pathname: string): ParsedPath | null {
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname.startsWith("/_next")
  ) {
    return null;
  }

  const path = pathname.split("?")[0] || "/";
  const segments = path.split("/").filter(Boolean);

  if (segments.length === 0) {
    return { path: "/", pageType: "home" };
  }

  if (segments[0] === "log") {
    if (segments[1] === "archive") {
      return { path, pageType: "log-archive" };
    }
    if (segments[1]) {
      return {
        path,
        pageType: "log",
        resourceSlug: segments[1],
      };
    }
    return null;
  }

  if (segments[0] === "timeline") {
    return { path, pageType: "timeline" };
  }

  if (segments.length === 2) {
    return {
      path,
      pageType: "project",
      sectionSlug: segments[0],
      resourceSlug: segments[1],
    };
  }

  if (segments.length === 1) {
    return {
      path,
      pageType: "section",
      sectionSlug: segments[0],
    };
  }

  return null;
}

export function normalizeReferrer(
  referrer: string | null | undefined,
  host: string | null | undefined
): string {
  if (!referrer?.trim()) {
    return "direct";
  }

  try {
    const url = new URL(referrer);
    const currentHost = host?.trim().toLowerCase();

    if (currentHost && url.host.toLowerCase() === currentHost) {
      return "internal";
    }

    return url.hostname.toLowerCase();
  } catch {
    return "direct";
  }
}

export async function recordPageView(input: RecordPageViewInput): Promise<void> {
  const parsed = parsePathForStats(input.path);
  if (!parsed) return;

  const date = todayDateString();
  const referrer = normalizeReferrer(input.referrer, input.host);

  await prisma.visitor.upsert({
    where: { id: input.visitorId },
    create: { id: input.visitorId },
    update: { lastSeenAt: new Date() },
  });

  const visitorDay = await prisma.visitorDay.findUnique({
    where: {
      visitorId_date: {
        visitorId: input.visitorId,
        date,
      },
    },
  });

  if (!visitorDay) {
    await prisma.visitorDay.create({
      data: {
        visitorId: input.visitorId,
        date,
      },
    });
  }

  const pageVisitorDay = await prisma.pageViewVisitorDay.findUnique({
    where: {
      visitorId_date_path: {
        visitorId: input.visitorId,
        date,
        path: parsed.path,
      },
    },
  });

  const isUniquePageView = !pageVisitorDay;

  if (isUniquePageView) {
    await prisma.pageViewVisitorDay.create({
      data: {
        visitorId: input.visitorId,
        date,
        path: parsed.path,
      },
    });
  }

  await prisma.pageViewDaily.upsert({
    where: {
      date_path: {
        date,
        path: parsed.path,
      },
    },
    create: {
      date,
      path: parsed.path,
      pageType: parsed.pageType,
      resourceSlug: parsed.resourceSlug ?? null,
      sectionSlug: parsed.sectionSlug ?? null,
      views: 1,
      uniqueViews: isUniquePageView ? 1 : 0,
    },
    update: {
      views: { increment: 1 },
      ...(isUniquePageView ? { uniqueViews: { increment: 1 } } : {}),
    },
  });

  await prisma.referrerDaily.upsert({
    where: {
      date_referrer: {
        date,
        referrer,
      },
    },
    create: {
      date,
      referrer,
      views: 1,
    },
    update: {
      views: { increment: 1 },
    },
  });
}

export async function recordLinkClick(input: RecordLinkClickInput): Promise<void> {
  if (!isTrackableExternalUrl(input.url)) return;

  await prisma.linkClick.create({
    data: {
      url: input.url.trim(),
      source: input.source,
      sourcePath: input.sourcePath,
      contextId: input.contextId ?? null,
      label: input.label?.trim() || null,
      visitorId: input.visitorId ?? null,
    },
  });
}

export async function getStatsSummary(days = 30): Promise<StatsSummary> {
  const since = dateDaysAgo(days - 1);
  const today = todayDateString();

  const [
    uniqueVisitors,
    uniqueVisitorsToday,
    pageViewTotals,
    linkClickCount,
    referrerRows,
    logPageRows,
    projectPageRows,
    linkClickRows,
    logLinkClickRows,
    dailyRows,
    logEntries,
    projects,
  ] = await Promise.all([
    prisma.visitor.count(),
    prisma.visitorDay.count({
      where: { date: today },
    }),
    prisma.pageViewDaily.aggregate({
      where: { date: { gte: since } },
      _sum: { views: true },
    }),
    prisma.linkClick.count({
      where: {
        createdAt: {
          gte: new Date(`${since}T00:00:00.000Z`),
        },
      },
    }),
    prisma.referrerDaily.groupBy({
      by: ["referrer"],
      where: { date: { gte: since } },
      _sum: { views: true },
      orderBy: { _sum: { views: "desc" } },
      take: 10,
    }),
    prisma.pageViewDaily.groupBy({
      by: ["path", "resourceSlug"],
      where: {
        date: { gte: since },
        pageType: "log",
        resourceSlug: { not: null },
      },
      _sum: { views: true, uniqueViews: true },
      orderBy: { _sum: { views: "desc" } },
    }),
    prisma.pageViewDaily.groupBy({
      by: ["path", "resourceSlug", "sectionSlug"],
      where: {
        date: { gte: since },
        pageType: "project",
        resourceSlug: { not: null },
        sectionSlug: { not: null },
      },
      _sum: { views: true, uniqueViews: true },
      orderBy: { _sum: { views: "desc" } },
    }),
    prisma.linkClick.groupBy({
      by: ["url", "source", "label"],
      where: {
        createdAt: {
          gte: new Date(`${since}T00:00:00.000Z`),
        },
      },
      _count: { _all: true },
      orderBy: { _count: { url: "desc" } },
      take: 20,
    }),
    prisma.linkClick.groupBy({
      by: ["contextId", "url", "label"],
      where: {
        source: "log-content",
        contextId: { not: null },
        createdAt: {
          gte: new Date(`${since}T00:00:00.000Z`),
        },
      },
      _count: { _all: true },
      orderBy: { _count: { url: "desc" } },
    }),
    prisma.pageViewDaily.groupBy({
      by: ["date"],
      where: { date: { gte: since } },
      _sum: { views: true, uniqueViews: true },
      orderBy: { date: "asc" },
    }),
    prisma.logEntry.findMany({
      select: { id: true, slug: true, title: true },
    }),
    prisma.project.findMany({
      select: { slug: true, title: true, section: true },
    }),
  ]);

  const logTitleBySlug = Object.fromEntries(
    logEntries.map((entry) => [entry.slug, entry.title])
  );
  const logTitleById = Object.fromEntries(
    logEntries.map((entry) => [entry.id, entry.title])
  );
  const projectTitleByKey = Object.fromEntries(
    projects.map((project) => [`${project.section}/${project.slug}`, project.title])
  );

  return {
    uniqueVisitors,
    uniqueVisitorsToday,
    pageViewsLast30Days: pageViewTotals._sum.views ?? 0,
    linkClicksLast30Days: linkClickCount,
    referrers: referrerRows.map((row) => ({
      referrer: row.referrer,
      views: row._sum.views ?? 0,
    })),
    logPages: logPageRows
      .filter((row) => row.resourceSlug)
      .map((row) => ({
        path: row.path,
        slug: row.resourceSlug!,
        title: logTitleBySlug[row.resourceSlug!] ?? row.resourceSlug!,
        views: row._sum.views ?? 0,
        uniqueViews: row._sum.uniqueViews ?? 0,
      })),
    projectPages: projectPageRows
      .filter((row) => row.resourceSlug && row.sectionSlug)
      .map((row) => ({
        path: row.path,
        sectionSlug: row.sectionSlug!,
        slug: row.resourceSlug!,
        title:
          projectTitleByKey[`${row.sectionSlug}/${row.resourceSlug}`] ??
          row.resourceSlug!,
        views: row._sum.views ?? 0,
        uniqueViews: row._sum.uniqueViews ?? 0,
      })),
    linkClicks: linkClickRows.map((row) => ({
      url: row.url,
      source: row.source,
      label: row.label,
      clicks: row._count._all,
    })),
    logLinkClicks: logLinkClickRows
      .filter((row) => row.contextId)
      .map((row) => ({
        entryTitle: logTitleById[row.contextId!] ?? "Unknown log entry",
        url: row.url,
        label: row.label,
        clicks: row._count._all,
      })),
    dailyPageViews: dailyRows.map((row) => ({
      date: row.date,
      views: row._sum.views ?? 0,
      uniqueViews: row._sum.uniqueViews ?? 0,
    })),
  };
}
