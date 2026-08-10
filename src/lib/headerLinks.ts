import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
import { validateHeaderLinkIcon } from "@/lib/headerLinkIcons";
import type { HeaderLinkIconSlug } from "@/lib/headerLinkIcons";
import {
  deleteUploadFile,
  deleteUploadFiles,
  isManagedUploadUrl,
} from "@/lib/uploads";

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
  customIconUrl: string | null;
  sortOrder: number;
};

type HeaderLinkRecord = {
  id: string;
  label: string;
  url: string;
  icon: string;
  customIconUrl: string | null;
  sortOrder: number;
};

function toHeaderLink(record: HeaderLinkRecord): HeaderLink {
  return {
    id: record.id,
    label: record.label,
    url: record.url,
    icon: record.icon as HeaderLinkIconSlug,
    customIconUrl: record.customIconUrl ?? null,
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

function parseCustomIconUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new ApiError("Custom icon URL must be a string", 400);
  }

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (!isManagedUploadUrl(trimmed) && !trimmed.startsWith("/uploads/")) {
    throw new ApiError("Custom icon must be an uploaded image", 400);
  }

  return trimmed;
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
  customIconUrl?: string | null;
  sortOrder?: number;
};

function parseHeaderLinkFields(body: HeaderLinkInput) {
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
    customIconUrl:
      body.customIconUrl !== undefined
        ? parseCustomIconUrl(body.customIconUrl)
        : undefined,
  };
}

export async function createHeaderLink(body: HeaderLinkInput) {
  const fields = parseHeaderLinkFields(body);

  const maxOrder = await prisma.headerLink.aggregate({
    _max: { sortOrder: true },
  });
  const sortOrder =
    typeof body.sortOrder === "number"
      ? body.sortOrder
      : (maxOrder._max.sortOrder ?? -1) + 1;

  const link = await prisma.headerLink.create({
    data: {
      label: fields.label,
      url: fields.url,
      icon: fields.icon,
      customIconUrl: fields.customIconUrl ?? null,
      sortOrder,
    },
  });

  return toHeaderLink(link);
}

export async function updateHeaderLink(id: string, body: HeaderLinkInput) {
  const existing = await prisma.headerLink.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Header link not found", 404);
  }

  const fields = parseHeaderLinkFields(body);
  const sortOrder =
    typeof body.sortOrder === "number" ? body.sortOrder : existing.sortOrder;
  const customIconUrl =
    fields.customIconUrl !== undefined
      ? fields.customIconUrl
      : existing.customIconUrl;

  const link = await prisma.headerLink.update({
    where: { id },
    data: {
      label: fields.label,
      url: fields.url,
      icon: fields.icon,
      customIconUrl,
      sortOrder,
    },
  });

  if (
    existing.customIconUrl &&
    existing.customIconUrl !== customIconUrl
  ) {
    await deleteUploadFile(existing.customIconUrl);
  }

  return toHeaderLink(link);
}

export async function reorderHeaderLinks(orderedIds: string[]) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    throw new ApiError("orderedIds must be a non-empty array", 400);
  }

  if (orderedIds.some((id) => typeof id !== "string" || !id.trim())) {
    throw new ApiError("Each ordered id must be a non-empty string", 400);
  }

  const uniqueIds = new Set(orderedIds);
  if (uniqueIds.size !== orderedIds.length) {
    throw new ApiError("orderedIds must not contain duplicates", 400);
  }

  const existing = await prisma.headerLink.findMany({ select: { id: true } });
  if (existing.length !== orderedIds.length) {
    throw new ApiError("orderedIds must include every header link", 400);
  }

  for (const link of existing) {
    if (!uniqueIds.has(link.id)) {
      throw new ApiError("orderedIds must include every header link", 400);
    }
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.headerLink.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );

  return getHeaderLinks();
}

export async function deleteHeaderLink(id: string) {
  const link = await prisma.headerLink.findUnique({ where: { id } });
  if (!link) {
    throw new ApiError("Header link not found", 404);
  }

  await prisma.headerLink.delete({ where: { id } });

  if (link.customIconUrl) {
    await deleteUploadFiles([link.customIconUrl]);
  }
}
