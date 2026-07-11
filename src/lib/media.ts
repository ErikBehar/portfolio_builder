import type { MediaItem, ProjectWithMedia } from "@/lib/types";

export function getProjectCoverMedia(
  project: Pick<ProjectWithMedia, "media" | "coverMediaId">
): MediaItem | undefined {
  if (project.coverMediaId) {
    const cover = project.media.find((item) => item.id === project.coverMediaId);
    if (cover) return cover;
  }

  return project.media.find((item) => item.type === "image") ?? project.media[0];
}

export function resolveCoverMediaId(
  media: { id: string; type: string }[],
  previewMediaIndex?: number | null
): string | null {
  if (media.length === 0) return null;

  if (
    previewMediaIndex !== undefined &&
    previewMediaIndex !== null &&
    previewMediaIndex >= 0 &&
    previewMediaIndex < media.length &&
    media[previewMediaIndex]?.type === "image"
  ) {
    return media[previewMediaIndex].id;
  }

  return media.find((item) => item.type === "image")?.id ?? null;
}

export function getDefaultPreviewMediaIndex(
  media: { id: string; type: string }[],
  coverMediaId?: string | null
): number {
  if (coverMediaId) {
    const coverIndex = media.findIndex((item) => item.id === coverMediaId);
    if (coverIndex >= 0) return coverIndex;
  }

  const firstImageIndex = media.findIndex((item) => item.type === "image");
  return firstImageIndex >= 0 ? firstImageIndex : 0;
}
