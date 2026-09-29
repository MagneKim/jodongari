const MAX_DIMENSION = 1600;

// Resizes/compresses an image file in the browser and returns a data URL.
// No upload happens here — this is local-only preview processing.
export async function resizeImageFile(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas context를 생성할 수 없습니다.");
  ctx.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", 0.85);
}
