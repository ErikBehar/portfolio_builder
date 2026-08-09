import { prisma } from "@/lib/db";

const RESERVED_FIRST_SEGMENTS = new Set([
  "admin",
  "api",
  "log",
  "timeline",
  "uploads",
]);

/**
 * Map a public pathname to the best admin edit/manage URL.
 * Returns null when there is no useful admin counterpart (or already in admin).
 */
export async function resolveAdminEditHref(
  pathname: string
): Promise<string | null> {
  if (!pathname || pathname.startsWith("/admin")) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "/admin";
  }

  if (segments[0] === "timeline") {
    return "/admin";
  }

  if (segments[0] === "log") {
    if (segments.length === 1 || segments[1] === "archive") {
      return "/admin/log";
    }

    const entry = await prisma.logEntry.findUnique({
      where: { slug: segments[1] },
      select: { id: true },
    });
    return entry ? `/admin/log/${entry.id}` : "/admin/log";
  }

  if (RESERVED_FIRST_SEGMENTS.has(segments[0])) {
    return null;
  }

  const sectionSlug = segments[0];
  const section = await prisma.portfolioSection.findUnique({
    where: { slug: sectionSlug },
    select: { slug: true },
  });

  if (!section) {
    return null;
  }

  if (segments.length === 1) {
    return `/admin/${section.slug}`;
  }

  if (segments.length === 2) {
    const project = await prisma.project.findFirst({
      where: { section: section.slug, slug: segments[1] },
      select: { id: true },
    });
    return project
      ? `/admin/${section.slug}/${project.id}`
      : `/admin/${section.slug}`;
  }

  return `/admin/${section.slug}`;
}
