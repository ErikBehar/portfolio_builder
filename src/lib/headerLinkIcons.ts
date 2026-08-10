export const HEADER_LINK_ICONS = [
  { slug: "envelope", label: "Email" },
  { slug: "file", label: "Document / CV" },
  { slug: "link", label: "Link" },
  { slug: "github", label: "GitHub" },
  { slug: "linkedin", label: "LinkedIn" },
  { slug: "twitter", label: "Twitter / X" },
  { slug: "instagram", label: "Instagram" },
  { slug: "youtube", label: "YouTube" },
  { slug: "globe", label: "Website" },
] as const;

export type HeaderLinkIconSlug = (typeof HEADER_LINK_ICONS)[number]["slug"];

export const HEADER_LINK_ICON_SIZES = [
  { value: "small", label: "Small", className: "h-4 w-4", px: 16 },
  { value: "medium", label: "Medium", className: "h-8 w-8", px: 32 },
  { value: "large", label: "Large", className: "h-16 w-16", px: 64 },
  { value: "xl", label: "XL", className: "h-32 w-32", px: 128 },
] as const;

export type HeaderLinkIconSize =
  (typeof HEADER_LINK_ICON_SIZES)[number]["value"];

const iconSlugs = new Set<string>(HEADER_LINK_ICONS.map((icon) => icon.slug));
const iconSizes = new Set<string>(
  HEADER_LINK_ICON_SIZES.map((size) => size.value)
);

export function isHeaderLinkIconSlug(value: string): value is HeaderLinkIconSlug {
  return iconSlugs.has(value);
}

export function isHeaderLinkIconSize(value: string): value is HeaderLinkIconSize {
  return iconSizes.has(value);
}

export function validateHeaderLinkIcon(icon: string): string | null {
  if (!isHeaderLinkIconSlug(icon)) {
    return "Choose a valid icon";
  }
  return null;
}

export function validateHeaderLinkIconSize(size: string): string | null {
  if (!isHeaderLinkIconSize(size)) {
    return "Choose a valid icon size";
  }
  return null;
}

export function getHeaderLinkIconSizeClass(
  size: HeaderLinkIconSize | string | null | undefined
): string {
  const match = HEADER_LINK_ICON_SIZES.find((entry) => entry.value === size);
  return match?.className ?? HEADER_LINK_ICON_SIZES[0].className;
}

export function normalizeHeaderLinkIconSize(
  size: string | null | undefined
): HeaderLinkIconSize {
  if (size && isHeaderLinkIconSize(size)) {
    return size;
  }
  return "small";
}
