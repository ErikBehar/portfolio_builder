import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
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

export type HeaderLinkInput = {
  label?: string;
  url?: string;
  icon?: string;
  sortOrder?: number;
};

function parseHeaderLinkInput(body: HeaderLinkInput) {
  if (!body.label?.trim()) {
    throw new ApiError("Label is required", 400);
  }

  const urlError = validateHeaderLinkUrl(body.url ?? "");
  if (urlError) {
    throw new ApiError(urlError, 400);
  }

  const iconError = validateHeaderLinkIcon(body.icon ?? "");
  if (iconError) {
    throw new ApiError(iconError, 400);
  }

  return {
    label: body.label.trim(),
    url: body.url!.trim(),
    icon: body.icon!,
    sortOrder: body.sortOrder ?? 0,
  };
}

export async function createHeaderLink(body: HeaderLinkInput) {
  const input = parseHeaderLinkInput(body);

  const link = await prisma.headerLink.create({
    data: input,
  });

  return toHeaderLink(link);
}

export async function updateHeaderLink(id: string, body: HeaderLinkInput) {
  const existing = await prisma.headerLink.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Header link not found", 404);
  }

  const input = parseHeaderLinkInput(body);

  const link = await prisma.headerLink.update({
    where: { id },
    data: input,
  });

  return toHeaderLink(link);
}

export async function deleteHeaderLink(id: string) {
  const link = await prisma.headerLink.findUnique({ where: { id } });
  if (!link) {
    throw new ApiError("Header link not found", 404);
  }

  await prisma.headerLink.delete({ where: { id } });
}
