export type MarkdownEditResult = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
};

const LINK_PATTERN = /^\[([^\]]+)\]\(([^)\s]+)\)$/;
const IMAGE_PATTERN = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const URL_LIKE_PATTERN = /^(https?:\/\/\S+|mailto:\S+)$/i;
const IMAGE_SRC_PATTERN = /^(https?:\/\/\S+|\/uploads\/[^\s/\\]+)$/i;

function replaceRange(
  value: string,
  start: number,
  end: number,
  next: string
): string {
  return value.slice(0, start) + next + value.slice(end);
}

function isWrappedWith(
  selected: string,
  prefix: string,
  suffix: string
): boolean {
  if (selected.length < prefix.length + suffix.length) return false;
  if (!selected.startsWith(prefix) || !selected.endsWith(suffix)) return false;

  // `*italic*` must not treat `**bold**` as already italic.
  if (
    prefix === "*" &&
    suffix === "*" &&
    selected.startsWith("**") &&
    selected.endsWith("**")
  ) {
    return false;
  }

  return true;
}

export function wrapSelection(
  value: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string,
  placeholder: string
): MarkdownEditResult {
  const selected = value.slice(start, end);

  if (isWrappedWith(selected, prefix, suffix)) {
    const inner = selected.slice(prefix.length, selected.length - suffix.length);
    return {
      value: replaceRange(value, start, end, inner),
      selectionStart: start,
      selectionEnd: start + inner.length,
    };
  }

  const before = value.slice(Math.max(0, start - prefix.length), start);
  const after = value.slice(end, end + suffix.length);
  if (
    before === prefix &&
    after === suffix &&
    !(
      prefix === "*" &&
      suffix === "*" &&
      value.slice(Math.max(0, start - 2), start) === "**" &&
      value.slice(end, end + 2) === "**"
    )
  ) {
    return {
      value:
        value.slice(0, start - prefix.length) +
        selected +
        value.slice(end + suffix.length),
      selectionStart: start - prefix.length,
      selectionEnd: end - prefix.length,
    };
  }

  const inner = selected.length > 0 ? selected : placeholder;
  const inserted = `${prefix}${inner}${suffix}`;
  const innerStart = start + prefix.length;

  return {
    value: replaceRange(value, start, end, inserted),
    selectionStart: innerStart,
    selectionEnd: innerStart + inner.length,
  };
}

export function insertMarkdownLink(
  value: string,
  start: number,
  end: number
): MarkdownEditResult {
  const selected = value.slice(start, end);
  const wrapped = selected.match(LINK_PATTERN);

  if (wrapped) {
    const label = wrapped[1];
    return {
      value: replaceRange(value, start, end, label),
      selectionStart: start,
      selectionEnd: start + label.length,
    };
  }

  if (URL_LIKE_PATTERN.test(selected.trim())) {
    const href = selected.trim();
    const label = "link text";
    const inserted = `[${label}](${href})`;
    return {
      value: replaceRange(value, start, end, inserted),
      selectionStart: start + 1,
      selectionEnd: start + 1 + label.length,
    };
  }

  const label = selected.length > 0 ? selected : "link text";
  const href = "https://";
  const inserted = `[${label}](${href})`;
  const hrefStart = start + label.length + 3;

  return {
    value: replaceRange(value, start, end, inserted),
    selectionStart: hrefStart,
    selectionEnd: hrefStart + href.length,
  };
}

function insertOnOwnLine(
  value: string,
  start: number,
  end: number,
  snippet: string,
  selectStartInSnippet: number,
  selectLength: number
): MarkdownEditResult {
  const prefix = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const suffix = end < value.length && value[end] !== "\n" ? "\n" : "";
  const inserted = `${prefix}${snippet}${suffix}`;

  return {
    value: replaceRange(value, start, end, inserted),
    selectionStart: start + prefix.length + selectStartInSnippet,
    selectionEnd: start + prefix.length + selectStartInSnippet + selectLength,
  };
}

export function fileStemAlt(filename: string): string {
  const base = filename.replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "");
  return base.trim() || "image";
}

export function insertMarkdownImage(
  value: string,
  start: number,
  end: number,
  preset?: { alt?: string; src?: string }
): MarkdownEditResult {
  const selected = value.slice(start, end);
  const wrapped = selected.match(IMAGE_PATTERN);

  if (wrapped && !preset) {
    const alt = wrapped[1];
    return {
      value: replaceRange(value, start, end, alt),
      selectionStart: start,
      selectionEnd: start + alt.length,
    };
  }

  const srcFromSelection = IMAGE_SRC_PATTERN.test(selected.trim())
    ? selected.trim()
    : null;
  const src = preset?.src ?? srcFromSelection ?? "https://";
  const alt =
    preset?.alt ??
    (srcFromSelection || selected.length === 0 ? "image" : selected);
  const snippet = `![${alt}](${src})`;
  const selectAlt = Boolean(preset?.src) || srcFromSelection !== null;

  if (selectAlt) {
    return insertOnOwnLine(value, start, end, snippet, 2, alt.length);
  }

  const srcStart = 2 + alt.length + 2;
  return insertOnOwnLine(value, start, end, snippet, srcStart, src.length);
}
