export type PageType =
  | "home"
  | "section"
  | "project"
  | "log"
  | "log-archive"
  | "timeline";

export type LinkSource =
  | "header"
  | "footer"
  | "project-links"
  | "rich-text"
  | "log-content";

export function isTrackableExternalUrl(url: string): boolean {
  const value = url.trim();
  return (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("mailto:")
  );
}
