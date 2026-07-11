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

const iconSlugs = new Set<string>(HEADER_LINK_ICONS.map((icon) => icon.slug));

export function isHeaderLinkIconSlug(value: string): value is HeaderLinkIconSlug {
  return iconSlugs.has(value);
}

export function validateHeaderLinkIcon(icon: string): string | null {
  if (!isHeaderLinkIconSlug(icon)) {
    return "Choose a valid icon";
  }
  return null;
}

