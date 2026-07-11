"use client";

import { useState } from "react";
import { ImageLightbox } from "@/components/ImageLightbox";
import type { MediaItem } from "@/lib/types";

type MediaCarouselProps = {
  media: MediaItem[];
};

function MaximizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4" />
    </svg>
  );
}

function MediaThumbnail({
  item,
  selected,
  onSelect,
}: {
  item: MediaItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={item.caption ?? "View media"}
      aria-current={selected}
      className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
        selected
          ? "border-accent"
          : "border-border opacity-70 hover:border-accent/60 hover:opacity-100"
      }`}
    >
      {item.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt="" className="h-full w-full object-cover" />
      ) : (
        <>
          <video src={item.url} muted className="h-full w-full object-cover" />
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">
            ▶
          </span>
        </>
      )}
    </button>
  );
}

export function MediaCarousel({ media }: MediaCarouselProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (media.length === 0) {
    return null;
  }

  const current = media[index];
  const hasMultiple = media.length > 1;

  function shiftIndex(delta: number) {
    setIndex((value) =>
      delta < 0
        ? value === 0
          ? media.length - 1
          : value - 1
        : value === media.length - 1
          ? 0
          : value + 1
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="relative aspect-video bg-surface-elevated">
          {current.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.url}
              alt={current.caption ?? "Media"}
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              key={current.url}
              src={current.url}
              controls
              className="h-full w-full bg-black object-contain"
            />
          )}

          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`View ${current.caption ?? "media"} full size`}
            className="absolute bottom-2 right-2 rounded-md border border-white/20 bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <MaximizeIcon />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={() => shiftIndex(-1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 px-3 py-2 text-sm backdrop-blur-sm transition-colors hover:border-accent"
                aria-label="Previous media"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => shiftIndex(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-background/80 px-3 py-2 text-sm backdrop-blur-sm transition-colors hover:border-accent"
                aria-label="Next media"
              >
                →
              </button>
            </>
          )}
        </div>

        {hasMultiple && (
          <div className="flex gap-2 overflow-x-auto border-t border-border px-4 py-3">
            {media.map((item, itemIndex) => (
              <MediaThumbnail
                key={item.id}
                item={item}
                selected={itemIndex === index}
                onSelect={() => setIndex(itemIndex)}
              />
            ))}
          </div>
        )}

        {current.caption && (
          <p className="px-4 py-3 text-sm text-muted">{current.caption}</p>
        )}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          media={media}
          index={index}
          onIndexChange={setIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
