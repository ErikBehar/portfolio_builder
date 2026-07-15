import { validateSectionColor } from "@/lib/sectionValidation";

export type ThemeColors = {
  background: string;
  foreground: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  muted: string;
  accent: string;
  accentForeground: string;
};

export const DEFAULT_THEME_COLORS: ThemeColors = {
  background: "#0c0f14",
  foreground: "#e8edf5",
  surface: "#12161d",
  surfaceElevated: "#1a1f28",
  border: "#2a3140",
  muted: "#8b95a8",
  accent: "#5b9fd4",
  accentForeground: "#0c0f14",
};

export const THEME_COLOR_FIELDS: {
  key: keyof ThemeColors;
  label: string;
  description: string;
}[] = [
  {
    key: "background",
    label: "Page background",
    description: "Main background color across all pages.",
  },
  {
    key: "foreground",
    label: "Primary text",
    description: "Default body text and headings.",
  },
  {
    key: "surface",
    label: "Surface",
    description: "Cards, panels, and elevated containers.",
  },
  {
    key: "surfaceElevated",
    label: "Surface elevated",
    description: "Slightly lighter surfaces such as media placeholders.",
  },
  {
    key: "border",
    label: "Borders",
    description: "Dividers, outlines, and card borders.",
  },
  {
    key: "muted",
    label: "Muted text",
    description: "Secondary text, captions, and hints.",
  },
  {
    key: "accent",
    label: "Accent",
    description: "Links, highlights, and interactive emphasis.",
  },
  {
    key: "accentForeground",
    label: "Accent text",
    description: "Text on accent-colored buttons.",
  },
];

function normalizeThemeColor(
  value: string | null | undefined,
  fallback: string
): string {
  const trimmed = value?.trim() || fallback;
  return validateSectionColor(trimmed) ? fallback.toLowerCase() : trimmed.toLowerCase();
}

export function normalizeThemeColors(
  input: Partial<ThemeColors> | null | undefined
): ThemeColors {
  const defaults = DEFAULT_THEME_COLORS;

  return {
    background: normalizeThemeColor(input?.background, defaults.background),
    foreground: normalizeThemeColor(input?.foreground, defaults.foreground),
    surface: normalizeThemeColor(input?.surface, defaults.surface),
    surfaceElevated: normalizeThemeColor(
      input?.surfaceElevated,
      defaults.surfaceElevated
    ),
    border: normalizeThemeColor(input?.border, defaults.border),
    muted: normalizeThemeColor(input?.muted, defaults.muted),
    accent: normalizeThemeColor(input?.accent, defaults.accent),
    accentForeground: normalizeThemeColor(
      input?.accentForeground,
      defaults.accentForeground
    ),
  };
}

export function parseThemeColors(raw: string | null | undefined): ThemeColors {
  if (!raw?.trim()) {
    return DEFAULT_THEME_COLORS;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ThemeColors>;
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_THEME_COLORS;
    }
    return normalizeThemeColors(parsed);
  } catch {
    return DEFAULT_THEME_COLORS;
  }
}

export function serializeThemeColors(colors: ThemeColors): string {
  return JSON.stringify(normalizeThemeColors(colors));
}

export function validateThemeColorsInput(
  input: unknown
): string | ThemeColors {
  if (input === undefined) {
    return DEFAULT_THEME_COLORS;
  }

  if (!input || typeof input !== "object") {
    return "Theme colors must be an object";
  }

  const colors = input as Partial<ThemeColors>;

  for (const field of THEME_COLOR_FIELDS) {
    const value = colors[field.key];
    if (value !== undefined && typeof value !== "string") {
      return `${field.label} must be a color string`;
    }
    if (value?.trim()) {
      const colorError = validateSectionColor(value.trim());
      if (colorError) return colorError;
    }
  }

  return normalizeThemeColors(colors);
}

export function themeColorsToCssVars(
  colors: ThemeColors
): Record<string, string> {
  return {
    "--background": colors.background,
    "--foreground": colors.foreground,
    "--surface": colors.surface,
    "--surface-elevated": colors.surfaceElevated,
    "--border": colors.border,
    "--muted": colors.muted,
    "--accent": colors.accent,
    "--accent-foreground": colors.accentForeground,
  };
}
