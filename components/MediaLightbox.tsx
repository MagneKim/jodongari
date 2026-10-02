"use client";

import { useEffect } from "react";
import type { SightingMedia } from "@/lib/types";

// image media 전용 원본 보기. video/audio는 다루지 않는다 (MediaViewer에서 image만 넘겨준다).
export function MediaLightbox({
  images,
  index,
  onIndexChange,
  onClose,
  altPrefix,
}: {
  images: SightingMedia[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  altPrefix: string;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndexChange((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") onIndexChange((index + 1) % images.length);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [index, images.length, onClose, onIndexChange]);

  const item = images[index];
  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-0 sm:p-6"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="닫기"
        className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white"
      >
        ×
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index - 1 + images.length) % images.length);
            }}
            aria-label="이전 사진"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white sm:left-4"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange((index + 1) % images.length);
            }}
            aria-label="다음 사진"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl leading-none text-white sm:right-4"
          >
            ›
          </button>
        </>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.url}
        alt={`${altPrefix} 원본 이미지`}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[100dvh] max-w-[100vw] object-contain sm:max-h-[90vh] sm:max-w-[90vw]"
      />
    </div>
  );
}
