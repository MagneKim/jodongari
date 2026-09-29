import type { SightingMedia } from "@/lib/types";

// image/video는 visual grid로, audio는 별도의 compact player row로 표시한다 (사진+영상+오디오를
// 억지로 하나의 image grid에 넣지 않는다).
export function MediaViewer({ media, altPrefix }: { media: SightingMedia[]; altPrefix: string }) {
  const visual = media.filter((m) => m.type === "image" || m.type === "video");
  const audio = media.filter((m) => m.type === "audio");

  return (
    <>
      {visual.length === 1 && (
        <div className="mt-3 overflow-hidden rounded-[20px]">
          <VisualMedia
            item={visual[0]}
            alt={`${altPrefix} 미디어`}
            className="aspect-[4/3] w-full object-cover lg:aspect-[16/9]"
          />
        </div>
      )}

      {visual.length === 2 && (
        <div className="mt-3 grid grid-cols-2 gap-1 overflow-hidden rounded-[20px]">
          {visual.map((m, i) => (
            <VisualMedia key={m.id} item={m} alt={`${altPrefix} 미디어 ${i + 1}`} className="aspect-square w-full object-cover" />
          ))}
        </div>
      )}

      {visual.length >= 3 && (
        <div className="mt-3 grid grid-cols-3 gap-1 overflow-hidden rounded-[20px]">
          <VisualMedia
            item={visual[0]}
            alt={`${altPrefix} 미디어 1`}
            className="col-span-3 aspect-[4/3] w-full object-cover lg:aspect-[16/9]"
          />
          {visual.slice(1).map((m, i) => (
            <VisualMedia key={m.id} item={m} alt={`${altPrefix} 미디어 ${i + 2}`} className="aspect-square w-full object-cover" />
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
    </>
  );
}

function VisualMedia({ item, alt, className }: { item: SightingMedia; alt: string; className: string }) {
  if (item.type === "video") {
    return <video controls src={item.url} className={className} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={item.url} alt={alt} className={className} />;
}
