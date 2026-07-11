import { parseDateInput, toDateKey } from "@/lib/dates";
import { ApiError } from "@/lib/apiErrors";
import { prisma } from "@/lib/db";
import {
  buildMediaCreateInput,
  replaceLogMedia,
  type MediaInput,
} from "@/lib/mediaSync";
import { slugify } from "@/lib/slug";
import { deleteUploadFiles } from "@/lib/uploads";
import type { LogEntryWithMedia } from "@/lib/types";

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

  return toLogEntry(entry);
}

export type LogEntryInput = {
  title?: string;
  content?: string;
  date?: string;
  media?: MediaInput[];
};

function validateLogEntryInput(body: LogEntryInput) {
  if (!body.title?.trim()) {
    throw new ApiError("Title is required", 400);
  }

  if (!body.content?.trim()) {
    throw new ApiError("Content is required", 400);
  }

  if (!body.date) {
    throw new ApiError("Date is required", 400);
  }

  return {
    title: body.title.trim(),
    content: body.content.trim(),
    date: parseDateInput(body.date),
    slug: slugify(body.title),
  };
}

async function assertLogSlugAvailable(slug: string, existingId?: string) {
  const conflict = await prisma.logEntry.findFirst({
    where: {
      slug,
      ...(existingId ? { NOT: { id: existingId } } : {}),
    },
  });

  if (conflict) {
    throw new ApiError("A log entry with this title already exists", 409);
  }
}

export async function createLogEntry(body: LogEntryInput) {
  const input = validateLogEntryInput(body);
  await assertLogSlugAvailable(input.slug);

  const entry = await prisma.logEntry.create({
    data: {
      title: input.title,
      slug: input.slug,
      content: input.content,
      date: input.date,
      media: {
        create: buildMediaCreateInput(body.media ?? []),
      },
    },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  return toLogEntry(entry);
}

export async function updateLogEntry(id: string, body: LogEntryInput) {
  const existing = await prisma.logEntry.findUnique({
    where: { id },
    include: { media: true },
  });

  if (!existing) {
    throw new ApiError("Log entry not found", 404);
  }

  const input = validateLogEntryInput(body);
  await assertLogSlugAvailable(input.slug, id);
  await replaceLogMedia(
    id,
    existing.media.map((item) => item.url),
    body.media ?? []
  );

  const entry = await prisma.logEntry.update({
    where: { id },
    data: {
      title: input.title,
      slug: input.slug,
      content: input.content,
      date: input.date,
      media: {
        create: buildMediaCreateInput(body.media ?? []),
      },
    },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });

  return toLogEntry(entry);
}

export async function deleteLogEntry(id: string) {
  const entry = await prisma.logEntry.findUnique({
    where: { id },
    include: { media: true },
  });

  if (!entry) {
    throw new ApiError("Log entry not found", 404);
  }

  const mediaUrls = entry.media.map((item) => item.url);
  await prisma.logEntry.delete({ where: { id } });
  await deleteUploadFiles(mediaUrls);
}
