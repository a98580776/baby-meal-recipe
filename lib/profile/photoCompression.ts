// Client-side resize+compress for the baby profile photo before it's stored
// as a data URL in localStorage (lib/profile/babyProfile.ts). Recent phone
// camera photos routinely exceed several MB, but the on-screen avatar only
// ever renders at a small size — so we accept a generous raw upload, then
// shrink it down to something reasonable to keep localStorage light.

// Upload-time guard only, before we try to decode the file at all.
export const RAW_UPLOAD_MAX_BYTES = 15 * 1024 * 1024; // 15MB

const MAX_DIMENSION_PX = 512; // longer edge, comfortably above the largest on-screen avatar size
const TARGET_MAX_BYTES = 500 * 1024; // 500KB
const QUALITY_STEPS = [0.82, 0.7, 0.6, 0.5, 0.4, 0.3];

function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function decodeToBitmapSource(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to the <img> based path below
    }
  }
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("image decode failed"));
      img.src = objectUrl;
    });
    return img;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function sourceDimensions(source: ImageBitmap | HTMLImageElement): { width: number; height: number } {
  return "naturalWidth" in source
    ? { width: source.naturalWidth, height: source.naturalHeight }
    : { width: source.width, height: source.height };
}

/**
 * Resizes the image to at most MAX_DIMENSION_PX on its longer edge and
 * re-encodes it as JPEG, stepping quality down until the result fits under
 * TARGET_MAX_BYTES (or the lowest quality step is reached).
 */
export async function compressPhotoToDataUrl(file: File): Promise<string> {
  const source = await decodeToBitmapSource(file);
  const { width, height } = sourceDimensions(source);
  const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(width, height));
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  if ("close" in source) source.close();

  let dataUrl = canvas.toDataURL("image/jpeg", QUALITY_STEPS[0]);
  for (let i = 1; i < QUALITY_STEPS.length && dataUrlByteLength(dataUrl) > TARGET_MAX_BYTES; i++) {
    dataUrl = canvas.toDataURL("image/jpeg", QUALITY_STEPS[i]);
  }
  return dataUrl;
}
