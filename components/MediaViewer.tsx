"use client";

import { useState } from "react";
import type { SightingMedia } from "@/lib/types";
import { MediaLightbox } from "./MediaLightbox";

// image/video는 visual grid로, audio는 별도의 compact player row로 표시한다 (사진+영상+오디오를
// 억지로 하나의 image grid에 넣지 않는다).
export function MediaViewer({ media, altPrefix }: { media: SightingMedia[]; altPrefix: string }) {
  const visual = media.filter((m) => m.type === "image" || m.type === "video");
  const audio = media.filter((m) => m.type === "audio");
  const images = visual.filter((m) => m.type === "image");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (item: SightingMedia) => {
    if (item.type !== "image") return;
    const idx = images.findIndex((m) => m.id === item.id);
    if (idx !== -1) setLightboxIndex(idx);
  };

  return (
    <>
      {visual.length === 1 && (
        <div className="mt-3 overflow-hidden rounded-[20px] bg-surface-secondary">
          <VisualMedia
            item={visual[0]}
            alt={`${altPrefix} 미디어`}
            className="max-h-[480px] w-full object-contain sm:max-h-[600px]"
            onClick={openLightbox}
          />
        </div>
      )}

      {visual.length === 2 && (
        <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-[20px]">
          {visual.map((m, i) => (
            <VisualMedia
              key={m.id}
              item={m}
              alt={`${altPrefix} 미디어 ${i + 1}`}
              className="aspect-square w-full object-cover"
              onClick={openLightbox}
            />
          ))}
        </div>
      )}

      {visual.length >= 3 && (
        <div className="mt-3 grid grid-cols-3 gap-1 overflow-hidden rounded-[20px]">
          <VisualMedia
            item={visual[0]}
            alt={`${altPrefix} 미디어 1`}
            className="col-span-3 aspect-[4/3] w-full object-cover lg:aspect-[16/9]"
            onClick={openLightbox}
          />
          {visual.slice(1).map((m, i) => (
            <VisualMedia
              key={m.id}
              item={m}
              alt={`${altPrefix} 미디어 ${i + 2}`}
              className="aspect-square w-full object-cover"
              onClick={openLightbox}
            />
          ))}
        </div>
      )}

      {audio.map((m) => (
        <div key={m.id} className="mt-3 flex items-center gap-2 rounded-[20px] border border-border bg-surface-secondary p-2.5">
          <span aria-hidden="true" className="shrink-0 text-sm">
            🎧
          </span>
          <audio controls src={m.url} className="h-9 w-full min-w-0" />
        </div>
      ))}

      {lightboxIndex !== null && (
        <MediaLightbox
          images={images}
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={() => setLightboxIndex(null)}
          altPrefix={altPrefix}
        />
      )}
    </>
  );
}

function VisualMedia({
  item,
  alt,
  className,
  onClick,
}: {
  item: SightingMedia;
  alt: string;
  className: string;
  onClick: (item: SightingMedia) => void;
}) {
  if (item.type === "video") {
    return <video controls src={item.url} className={className} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={alt}
      onClick={() => onClick(item)}
      className={`cursor-zoom-in ${className}`}
    />
  );
}
