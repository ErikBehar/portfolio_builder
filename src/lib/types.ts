export const SHOW_LABEL_SLUG = "show";
export const FEATURED_LABEL_SLUG = "featured";

export type ProjectLabel = {
  id: string;
  name: string;
  slug: string;
};

export type ProjectLink = {
  label: string;
  url: string;
};

export type MediaType = "image" | "video";

export type MediaItem = {
  id: string;
  type: MediaType;
  url: string;
  caption: string | null;
  sortOrder: number;
};

export type LogComment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};

export type ProjectComment = LogComment;

export type ProjectWithMedia = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  section: string;
  category: string | null;
  links: ProjectLink[];
  sortOrder: number;
  coverMediaId: string | null;
  createdAt: string;
  labels: ProjectLabel[];
  media: MediaItem[];
  comments?: ProjectComment[];
};

export type LogEntryWithMedia = {
  id: string;
  title: string;
  slug: string;
  content: string;
  date: string;
  media: MediaItem[];
  comments?: LogComment[];
};
