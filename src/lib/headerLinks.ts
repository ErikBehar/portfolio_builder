import { prisma } from "@/lib/db";
import { ApiError } from "@/lib/apiErrors";
import {
  customIconIdFromValue,
  customIconValueFromId,
  isCustomHeaderLinkIcon,
  isHeaderLinkIconSlug,
  validateHeaderLinkIcon,
} from "@/lib/headerLinkIcons";
import type { HeaderLinkIconSlug } from "@/lib/headerLinkIcons";
import {
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

export type HeaderLinkCustomIcon = {
  id: string;
  label: string;
  url: string;
  value: string;
};

export type HeaderLink = {
  id: string;
  label: string;
  url: string;
  icon: string;
  iconImageUrl: string | null;
  sortOrder: number;
};

type HeaderLinkRecord = {
  id: string;
  label: string;
  url: string;
  icon: string;
  sortOrder: number;
};

function toCustomIcon(record: {
  id: string;
  label: string;
  url: string;
}): HeaderLinkCustomIcon {
  return {
    id: record.id,
    label: record.label,
    url: record.url,
    value: customIconValueFromId(record.id),
  };
}

function toHeaderLink(
  record: HeaderLinkRecord,
  customIconUrls: Map<string, string>
): HeaderLink {
  const customId = customIconIdFromValue(record.icon);
  return {
    id: record.id,
    label: record.label,
    url: record.url,
    icon: record.icon,
    iconImageUrl: customId ? customIconUrls.get(customId) ?? null : null,
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

async function getCustomIconUrlMap(): Promise<Map<string, string>> {
  const icons = await prisma.headerLinkCustomIcon.findMany({
    select: { id: true, url: true },
  });
  return new Map(icons.map((icon) => [icon.id, icon.url]));
}

async function assertValidIconValue(icon: string) {
  const formatError = validateHeaderLinkIcon(icon);
  if (formatError) {
    throw new ApiError(formatError, 400);
  }

  if (isHeaderLinkIconSlug(icon)) {
    return;
  }

  const customId = customIconIdFromValue(icon);
  if (!customId) {
    throw new ApiError("Choose a valid icon", 400);
  }

  const existing = await prisma.headerLinkCustomIcon.findUnique({
    where: { id: customId },
    select: { id: true },
  });
  if (!existing) {
    throw new ApiError("Custom icon not found", 400);
  }
}

export async function ensureDefaultHeaderLinks() {
  const count = await prisma.headerLink.count();
  if (count > 0) return;

  await prisma.headerLink.createMany({ data: DEFAULT_HEADER_LINKS });
}

export async function getHeaderLinks(): Promise<HeaderLink[]> {
  await ensureDefaultHeaderLinks();

  const [links, customIconUrls] = await Promise.all([
    prisma.headerLink.findMany({
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    }),
    getCustomIconUrlMap(),
  ]);

  return links.map((link) => toHeaderLink(link, customIconUrls));
}

export async function getHeaderLinkById(id: string): Promise<HeaderLink | null> {
  const link = await prisma.headerLink.findUnique({ where: { id } });
  if (!link) return null;
  const customIconUrls = await getCustomIconUrlMap();
  return toHeaderLink(link, customIconUrls);
}

export async function getHeaderLinkCustomIcons(): Promise<HeaderLinkCustomIcon[]> {
  const icons = await prisma.headerLinkCustomIcon.findMany({
    orderBy: [{ createdAt: "asc" }, { label: "asc" }],
  });
  return icons.map(toCustomIcon);
}

export async function createHeaderLinkCustomIcon(body: {
  label?: string;
  url?: string;
}): Promise<HeaderLinkCustomIcon> {
  const label = body.label?.trim() || "Custom icon";
  const url = body.url?.trim() ?? "";

  if (!url || !isManagedUploadUrl(url)) {
    throw new ApiError("Custom icon must be an uploaded image", 400);
  }

  const icon = await prisma.headerLinkCustomIcon.create({
    data: { label, url },
  });

  return toCustomIcon(icon);
}

export async function deleteHeaderLinkCustomIcon(id: string) {
  const icon = await prisma.headerLinkCustomIcon.findUnique({ where: { id } });
  if (!icon) {
    throw new ApiError("Custom icon not found", 404);
  }

  const iconValue = customIconValueFromId(id);
  const inUse = await prisma.headerLink.count({
    where: { icon: iconValue },
  });
  if (inUse > 0) {
    throw new ApiError(
      "This icon is still used by a header link. Choose a different icon on those links first.",
      400
    );
  }

  await prisma.headerLinkCustomIcon.delete({ where: { id } });
  await deleteUploadFiles([icon.url]);
}

export type HeaderLinkInput = {
  label?: string;
  url?: string;
  icon?: string;
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

  if (!body.icon?.trim()) {
    throw new ApiError("Icon is required", 400);
  }

  return {
    label: body.label.trim(),
    url: body.url!.trim(),
    icon: body.icon.trim(),
  };
}

export async function createHeaderLink(body: HeaderLinkInput) {
  const fields = parseHeaderLinkFields(body);
  await assertValidIconValue(fields.icon);

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
      sortOrder,
    },
  });

  const customIconUrls = await getCustomIconUrlMap();
  return toHeaderLink(link, customIconUrls);
}

export async function updateHeaderLink(id: string, body: HeaderLinkInput) {
  const existing = await prisma.headerLink.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError("Header link not found", 404);
  }

  const fields = parseHeaderLinkFields(body);
  await assertValidIconValue(fields.icon);
  const sortOrder =
    typeof body.sortOrder === "number" ? body.sortOrder : existing.sortOrder;

  const link = await prisma.headerLink.update({
    where: { id },
    data: {
      label: fields.label,
      url: fields.url,
      icon: fields.icon,
      sortOrder,
    },
  });

  const customIconUrls = await getCustomIconUrlMap();
  return toHeaderLink(link, customIconUrls);
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
}
