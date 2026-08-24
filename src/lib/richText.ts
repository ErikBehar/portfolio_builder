export type RichTextPart =
  | { type: "text"; value: string; bold?: boolean; italic?: boolean }
  | { type: "link"; label: string; href: string }
  | { type: "image"; alt: string; src: string };

const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const URL_PATTERN = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
const MARKDOWN_IMAGE_STRIP_PATTERN = /!\[([^\]]*)\]\([^)\s]+\)/g;
const MARKDOWN_LINK_STRIP_PATTERN = /\[([^\]]+)\]\([^)\s]+\)/g;
const INLINE_MARK_PATTERN = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;

export function plainTextFromRichText(input: string): string {
  return input
    .replace(MARKDOWN_IMAGE_STRIP_PATTERN, "$1")
    .replace(MARKDOWN_LINK_STRIP_PATTERN, "$1")
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
}

export function excerptRichText(input: string, maxLength = 280): string {
  const trimmed = plainTextFromRichText(input).trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

export function excerptRichTextParts(
  input: string,
  maxLength = 280
): RichTextPart[] {
  const parts = parseRichText(input);
  const result: RichTextPart[] = [];
  let used = 0;

  for (const part of parts) {
    if (used >= maxLength) break;
    if (part.type === "image") continue;

    const text = part.type === "text" ? part.value : part.label;
    const remaining = maxLength - used;

    if (text.length <= remaining) {
      result.push(part);
      used += text.length;
      continue;
    }

    const sliced = text.slice(0, remaining).trimEnd();
    if (sliced.length > 0) {
      result.push(
        part.type === "link"
          ? { type: "link", label: `${sliced}…`, href: part.href }
          : {
              type: "text",
              value: `${sliced}…`,
              bold: part.bold,
              italic: part.italic,
            }
      );
    } else if (result.length > 0) {
      const last = result[result.length - 1];
      if (last.type === "link") {
        result[result.length - 1] = { ...last, label: `${last.label}…` };
      } else if (last.type === "text") {
        result[result.length - 1] = { ...last, value: `${last.value}…` };
      }
    } else {
      result.push({ type: "text", value: "…" });
    }
    break;
  }

  return result;
}

export function isAllowedRichTextHref(href: string): boolean {
  const value = href.trim();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:")
  );
}

export function isAllowedRichTextImageSrc(src: string): boolean {
  const value = src.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) return true;
  if (!value.startsWith("/uploads/")) return false;

  const filename = value.slice("/uploads/".length);
  return (
    filename.length > 0 &&
    !filename.includes("/") &&
    !filename.includes("\\") &&
    !filename.includes("..")
  );
}

function parseTextWithMarks(text: string): RichTextPart[] {
  if (!text) return [];

  const parts: RichTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_MARK_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    if (match[2] !== undefined) {
      parts.push({ type: "text", value: match[2], bold: true, italic: true });
    } else if (match[3] !== undefined) {
      parts.push({ type: "text", value: match[3], bold: true });
    } else {
      parts.push({ type: "text", value: match[4], italic: true });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

function parseTextWithUrls(text: string): RichTextPart[] {
  const parts: RichTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push(...parseTextWithMarks(text.slice(lastIndex, index)));
    }

    const href = match[1];
    if (isAllowedRichTextHref(href)) {
      parts.push({ type: "link", label: href, href });
    } else {
      parts.push(...parseTextWithMarks(href));
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(...parseTextWithMarks(text.slice(lastIndex)));
  }

  return parts;
}

function parseTextWithLinks(input: string): RichTextPart[] {
  const parts: RichTextPart[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(MARKDOWN_LINK_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push(...parseTextWithUrls(input.slice(lastIndex, index)));
    }

    const href = match[2];
    if (isAllowedRichTextHref(href)) {
      parts.push({ type: "link", label: match[1], href: href.trim() });
    } else {
      parts.push({ type: "text", value: match[0] });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < input.length) {
    parts.push(...parseTextWithUrls(input.slice(lastIndex)));
  }

  return parts;
}

export function parseRichText(input: string): RichTextPart[] {
  const parts: RichTextPart[] = [];
  let lastIndex = 0;

  for (const match of input.matchAll(MARKDOWN_IMAGE_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push(...parseTextWithLinks(input.slice(lastIndex, index)));
    }

    const src = match[2].trim();
    if (isAllowedRichTextImageSrc(src)) {
      parts.push({ type: "image", alt: match[1], src });
    } else {
      parts.push(...parseTextWithLinks(match[0]));
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < input.length) {
    parts.push(...parseTextWithLinks(input.slice(lastIndex)));
  }

  return parts.length > 0 ? parts : [{ type: "text", value: input }];
}
