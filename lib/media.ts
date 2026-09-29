import { resizeImageFile } from "./photo";
import type { MediaType, SightingMedia } from "./types";

// 제한값은 여기 한 곳에서만 관리한다.
export const MEDIA_LIMITS = {
  maxCount: 5,
  maxImageBytes: 10 * 1024 * 1024,
  maxVideoBytes: 100 * 1024 * 1024,
  maxAudioBytes: 30 * 1024 * 1024,
} as const;

export function mediaTypeOf(mimeType: string): MediaType | null {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return null;
}

function maxBytesFor(type: MediaType): number {
  if (type === "image") return MEDIA_LIMITS.maxImageBytes;
  if (type === "video") return MEDIA_LIMITS.maxVideoBytes;
  return MEDIA_LIMITS.maxAudioBytes;
}

function maxLabelFor(type: MediaType): string {
  if (type === "image") return "10MB";
  if (type === "video") return "100MB";
  return "30MB";
}

let nextMediaId = 1;

// 파일을 SightingMedia로 변환한다. 지원하지 않는 형식/용량 초과 시 에러를 던진다 (호출부에서 표시).
// image는 resize/compress 후의 jpeg blob을, video/audio는 원본 File을 `blob`으로 함께 반환한다 —
// 제출 시 이 blob이 Supabase Storage에 업로드된다. `url`은 그때까지의 로컬 미리보기용이다.
export async function buildSightingMedia(file: File): Promise<SightingMedia> {
  const type = mediaTypeOf(file.type);
  if (!type) throw new Error(`지원하지 않는 파일 형식이에요: ${file.name}`);
  if (file.size > maxBytesFor(type)) {
    throw new Error(`${file.name}: 파일 용량은 최대 ${maxLabelFor(type)}까지 첨부할 수 있어요.`);
  }

  if (type === "image") {
    const dataUrl = await resizeImageFile(file);
    const blob = await (await fetch(dataUrl)).blob();
    return {
      id: `media-${nextMediaId++}`,
      type,
      name: file.name,
      mimeType: "image/jpeg",
      size: blob.size,
      url: dataUrl,
      blob,
    };
  }

  const url = URL.createObjectURL(file);
  return {
    id: `media-${nextMediaId++}`,
    type,
    name: file.name,
    mimeType: file.type,
    size: file.size,
    url,
    blob: file,
  };
}

export function revokeSightingMedia(media: SightingMedia) {
  if (media.type !== "image") URL.revokeObjectURL(media.url);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
