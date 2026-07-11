"use client";

import { useEffect } from "react";
import type { MediaItem } from "@/lib/types";

type ImageLightboxProps = {
  media: MediaItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-5 w-5"
      aria-hidden
    >
      {direction === "left" ? (
        <path d="m14 6-6 6 6 6" />
      ) : (
        <path d="m10 6 6 6-6 6" />
      )}
    </svg>
  );
}

export function ImageLightbox({
  media,
  index,
  onIndexChange,
  onClose,
}: ImageLightboxProps) {
  const current = media[index];
  const hasMultiple = media.length > 1;

  function goTo(delta: number) {
    onIndexChange(
      delta < 0
        ? index === 0
          ? media.length - 1
          : index - 1
        : index === media.length - 1
          ? 0
          : index + 1
    );
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft" && hasMultiple) {
        onIndexChange(index === 0 ? media.length - 1 : index - 1);
      } else if (event.key === "ArrowRight" && hasMultiple) {
        onIndexChange(index === media.length - 1 ? 0 : index + 1);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [hasMultiple, index, media.length, onClose, onIndexChange]);

  if (!current) return null;

  const alt = current.caption ?? "Media";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4 sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full size view"
        className="absolute right-4 top-4 z-10 rounded-md border border-white/20 bg-black/60 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
      >
        <CloseIcon />
      </button>

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goTo(-1);
            }}
            aria-label="Previous media"
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goTo(1);
            }}
            aria-label="Next media"
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/60 p-3 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
          >
            <ChevronIcon direction="right" />
          </button>
        </>
      )}

      <div
        className="flex max-h-full max-w-full flex-col items-center gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        {current.type === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.url}
            alt={alt}
            className="max-h-[calc(100vh-6rem)] max-w-full object-contain"
          />
        ) : (
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay
            className="max-h-[calc(100vh-6rem)] max-w-full bg-black object-contain"
          />
        )}

        {current.caption && (
          <p className="max-w-3xl text-center text-sm text-white/80">
            {current.caption}
          </p>
        )}

        {hasMultiple && (
          <p className="text-sm text-white/60">
            {index + 1} / {media.length}
          </p>
        )}
      </div>
    </div>
  );
}
