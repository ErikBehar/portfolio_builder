import { toDateKey } from "@/lib/dates";
import { prisma } from "@/lib/db";
import type { LogEntryWithMedia } from "@/lib/types";

export { formatLogDate } from "@/lib/dates";

type LogMediaRecord = {
  id: string;
  type: string;
  url: string;
  caption: string | null;
  sortOrder: number;
};

type LogEntryRecord = {
  id: string;
  title: string;
  slug: string;
  content: string;
  date: Date;
  media: LogMediaRecord[];
};

type LogEntryWithCommentsRecord = LogEntryRecord & {
  comments: {
    id: string;
    author: string;
    content: string;
    createdAt: Date;
  }[];
};

function mapMedia(media: LogMediaRecord[]) {
  return media
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => ({
      id: item.id,
      type: item.type as "image" | "video",
      url: item.url,
      caption: item.caption,
      sortOrder: item.sortOrder,
    }));
}

function toLogEntry(entry: LogEntryRecord): LogEntryWithMedia {
  return {
    id: entry.id,
    title: entry.title,
    slug: entry.slug,
    content: entry.content,
    date: toDateKey(entry.date),
    media: mapMedia(entry.media),
  };
}

function toLogEntryWithComments(entry: LogEntryWithCommentsRecord): LogEntryWithMedia {
  return {
    ...toLogEntry(entry),
    comments: entry.comments
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((comment) => ({
        id: comment.id,
        author: comment.author,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
      })),
  };
}

export async function getLatestLogEntry() {
  const entry = await prisma.logEntry.findFirst({
    orderBy: { date: "desc" },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  if (!entry) return null;
  return toLogEntry(entry);
}

export async function getLogEntries() {
  const entries = await prisma.logEntry.findMany({
    orderBy: { date: "desc" },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  return entries.map(toLogEntry);
}

export async function getLogEntryBySlug(slug: string) {
  const entry = await prisma.logEntry.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!entry) return null;
  return toLogEntryWithComments(entry);
}

export async function getLogEntryById(id: string, includeComments = false) {
  const entry = await prisma.logEntry.findUnique({
    where: { id },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      ...(includeComments
        ? { comments: { orderBy: { createdAt: "asc" } } }
        : {}),
    },
  });

  if (!entry) return null;

  if (includeComments && "comments" in entry) {
    return toLogEntryWithComments(entry as LogEntryWithCommentsRecord);
  }

  return toLogEntry(entry);
}
