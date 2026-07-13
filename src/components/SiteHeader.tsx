"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminMenu } from "@/components/AdminMenu";
import { HeaderLinkIcon } from "@/components/HeaderLinkIcon";
import { isTrackableExternalUrl } from "@/lib/statsTypes";
import { trackLinkClick } from "@/lib/clientStats";
import type { HeaderLink } from "@/lib/headerLinks";
import type { Section } from "@/lib/sections";

type SiteHeaderProps = {
  sections: Section[];
  headerLinks: HeaderLink[];
  siteTitle: string;
  siteTitleColor: string;
};

function formatSlug(slug: string): string {
  return slug.replace(/-/g, " ");
}

function isExternalUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function getBackHref(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  if (segments[0] === "admin") {
    if (segments.length === 1) return "/";
    if (segments[1] === "sections") {
      return segments.length === 2 ? "/admin" : "/admin/sections";
    }
    if (segments[1] === "labels") {
      return segments.length === 2 ? "/admin" : "/admin/labels";
    }
    if (segments[1] === "header-links") {
      return segments.length === 2 ? "/admin" : "/admin/header-links";
    }
    if (segments[1] === "site-settings") {
      return "/admin";
    }
    if (segments[1] === "stats") {
      return "/admin";
    }
    if (segments[1] === "log") {
      return segments.length === 2 ? "/admin" : "/admin/log";
    }
    if (segments.length === 2) return "/admin";
    if (segments[2] === "new") return `/admin/${segments[1]}`;
    return `/admin/${segments[1]}`;
  }

  if (segments[0] === "log") {
    if (segments.length === 2 && segments[1] === "archive") return "/";
    if (segments.length === 2) return "/log/archive";
  }

  if (segments[0] === "timeline") {
    return "/";
  }

  if (segments.length === 1) return "/";
  if (segments.length === 2) return `/${segments[0]}`;
  return null;
}

function getCurrentLabel(pathname: string, sectionTitles: Record<string, string>): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return "Home";

  if (segments[0] === "admin") {
    if (segments.length === 1 || segments[1] === "login") return "Admin";
    if (segments[1] === "log") {
      if (segments.length === 2) return "Admin · Log";
      return segments[2] === "new" ? "Admin · New log entry" : "Admin · Edit log entry";
    }
    if (segments[1] === "sections") {
      if (segments.length === 2) return "Admin · Sections";
      return segments[2] === "new" ? "Admin · New section" : "Admin · Edit section";
    }
    if (segments[1] === "labels") {
      if (segments.length === 2) return "Admin · Labels";
      return segments[2] === "new" ? "Admin · New label" : "Admin · Edit label";
    }
    if (segments[1] === "header-links") {
      if (segments.length === 2) return "Admin · Header links";
      return segments[2] === "new" ? "Admin · New header link" : "Admin · Edit header link";
    }
    if (segments[1] === "site-settings") {
      return "Admin · Site settings";
    }
    if (segments[1] === "stats") {
      return "Admin · Stats";
    }
    return `Admin · ${sectionTitles[segments[1]] ?? formatSlug(segments[1])}`;
  }

  if (segments[0] === "log") {
    if (segments.length === 1) return "Log";
    if (segments[1] === "archive") return "Log · Archive";
    return formatSlug(segments[1]);
  }

  if (segments[0] === "timeline") {
    return "Project timeline";
  }

  if (segments.length === 1) {
    return sectionTitles[segments[0]] ?? formatSlug(segments[0]);
  }
  if (segments.length === 2) return formatSlug(segments[1]);
  return sectionTitles[segments[0]] ?? formatSlug(segments[0]);
}

export function SiteHeader({
  sections,
  headerLinks,
  siteTitle,
  siteTitleColor,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const sectionTitles = Object.fromEntries(
    sections.map((section) => [section.slug, section.title])
  );
  const backHref = getBackHref(pathname);
  const currentLabel = getCurrentLabel(pathname, sectionTitles);
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          {backHref ? (
            <Link
              href={backHref}
              className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
            >
              ← Back
            </Link>
          ) : (
            <span className="w-[72px] shrink-0" aria-hidden />
          )}

          <div className="min-w-0">
            <Link
              href="/"
              className="block truncate text-xl font-semibold tracking-tight transition-opacity hover:opacity-80 sm:text-2xl"
              style={{ color: siteTitleColor }}
            >
              {siteTitle}
            </Link>
            {!isHome && (
              <p className="truncate text-sm capitalize text-muted">
                {currentLabel}
              </p>
            )}
          </div>
        </div>

        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          {headerLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target={isExternalUrl(link.url) ? "_blank" : undefined}
              rel={isExternalUrl(link.url) ? "noreferrer" : undefined}
              className="inline-flex max-w-[11rem] items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent sm:max-w-none"
              onClick={() => {
                if (isTrackableExternalUrl(link.url)) {
                  trackLinkClick({
                    url: link.url,
                    source: "header",
                    contextId: link.id,
                    label: link.label,
                  });
                }
              }}
            >
              <HeaderLinkIcon icon={link.icon} />
              <span className="truncate">{link.label}</span>
            </a>
          ))}
          <AdminMenu />
        </nav>
      </div>
    </header>
  );
}
