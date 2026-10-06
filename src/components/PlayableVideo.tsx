"use client";

import { useEffect, useRef, useState } from "react";

type PlayableVideoProps = {
  src: string;
  autoPlay?: boolean;
  className?: string;
  videoClassName?: string;
};

function PlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="ml-1 h-14 w-14"
      aria-hidden
    >
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86Z" />
    </svg>
  );
}

export function PlayableVideo({
  src,
  autoPlay = false,
  className,
  videoClassName,
}: PlayableVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const element = video;

    function sync() {
      setPaused(element.paused);
    }

    sync();
    element.addEventListener("play", sync);
    element.addEventListener("pause", sync);
    element.addEventListener("ended", sync);

    return () => {
      element.removeEventListener("play", sync);
      element.removeEventListener("pause", sync);
      element.removeEventListener("ended", sync);
    };
  }, [src]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <video
        ref={videoRef}
        src={src}
        controls
        autoPlay={autoPlay}
        playsInline
        className={videoClassName}
      />
      {paused && (
        <button
          type="button"
          aria-label="Play video"
          onClick={() => {
            void videoRef.current?.play();
          }}
          className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-black/75"
        >
          <PlayIcon />
        </button>
      )}
    </div>
  );
}
