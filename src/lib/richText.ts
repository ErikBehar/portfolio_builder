export type RichTextPart =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string };

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const URL_PATTERN = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g;
const MARKDOWN_LINK_STRIP_PATTERN = /\[([^\]]+)\]\([^)\s]+\)/g;

export function plainTextFromRichText(input: string): string {
  return input.replace(MARKDOWN_LINK_STRIP_PATTERN, "$1");
}

export function excerptRichText(input: string, maxLength = 280): string {
  const trimmed = plainTextFromRichText(input).trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

export function isAllowedRichTextHref(href: string): boolean {
  const value = href.trim();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:")
  );
}

function parseTextWithUrls(text: string): RichTextPart[] {
  const parts: RichTextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const href = match[1];
    if (isAllowedRichTextHref(href)) {
      parts.push({ type: "link", label: href, href });
    } else {
      parts.push({ type: "text", value: href });
    }

    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

export function parseRichText(input: string): RichTextPart[] {
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

  return parts.length > 0 ? parts : [{ type: "text", value: input }];
}
