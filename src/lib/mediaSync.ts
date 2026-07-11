import { prisma } from "@/lib/db";
import { deleteRemovedUploads } from "@/lib/uploads";

export type MediaInput = {
  type: string;
  url: string;
  caption?: string | null;
};

export function buildMediaCreateInput(media: MediaInput[] = []) {
  return media.map((item, index) => ({
    type: item.type,
    url: item.url,
    caption: item.caption ?? null,
    sortOrder: index,
  }));
}

export async function replaceProjectMedia(
  projectId: string,
  previousUrls: string[],
  media: MediaInput[] = []
) {
  const nextUrls = media.map((item) => item.url);
  await deleteRemovedUploads(previousUrls, nextUrls);
  await prisma.media.deleteMany({ where: { projectId } });
}

export async function replaceLogMedia(
  logEntryId: string,
  previousUrls: string[],
  media: MediaInput[] = []
) {
  const nextUrls = media.map((item) => item.url);
  await deleteRemovedUploads(previousUrls, nextUrls);
  await prisma.logMedia.deleteMany({ where: { logEntryId } });
}
