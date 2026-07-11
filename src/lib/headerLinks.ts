import { prisma } from "@/lib/db";
import { validateHeaderLinkIcon } from "@/lib/headerLinkIcons";
import type { HeaderLinkIconSlug } from "@/lib/headerLinkIcons";

export const DEFAULT_HEADER_LINKS: Array<{
  label: string;
  url: string;
  icon: HeaderLinkIconSlug;
  sortOrder: number;
}> = [
  {
    label: "Email",
    url: "mailto:you@example.com",
    icon: "envelope",
    sortOrder: 0,
  },
  {
    label: "CV",
    url: "#",
    icon: "file",
    sortOrder: 1,
  },
];

export type HeaderLink = {
  id: string;
  label: string;
  url: string;
  icon: HeaderLinkIconSlug;
  sortOrder: number;
};

type HeaderLinkRecord = {
  id: string;
  label: string;
  url: string;
  icon: string;
  sortOrder: number;
};

function toHeaderLink(record: HeaderLinkRecord): HeaderLink {
  return {
    id: record.id,
    label: record.label,
    url: record.url,
    icon: record.icon as HeaderLinkIconSlug,
    sortOrder: record.sortOrder,
  };
}

export function validateHeaderLinkUrl(url: string): string | null {
  const value = url.trim();
  if (!value) return "URL is required";

  if (
    value.startsWith("mailto:") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/") ||
    value === "#"
  ) {
    return null;
  }

  return "URL must start with http://, https://, mailto:, /, or be #";
}

export async function ensureDefaultHeaderLinks() {
  const count = await prisma.headerLink.count();
  if (count > 0) return;

  await prisma.headerLink.createMany({ data: DEFAULT_HEADER_LINKS });
}

export async function getHeaderLinks(): Promise<HeaderLink[]> {
  await ensureDefaultHeaderLinks();

  const links = await prisma.headerLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  return links.map(toHeaderLink);
}

export async function getHeaderLinkById(id: string): Promise<HeaderLink | null> {
  const link = await prisma.headerLink.findUnique({ where: { id } });
  if (!link) return null;
  return toHeaderLink(link);
}

export function validateHeaderLinkInput(body: {
  label?: string;
  url?: string;
  icon?: string;
}): string | null {
  if (!body.label?.trim()) return "Label is required";

  const urlError = validateHeaderLinkUrl(body.url ?? "");
  if (urlError) return urlError;

  const iconError = validateHeaderLinkIcon(body.icon ?? "");
  if (iconError) return iconError;

  return null;
}
