"use client";

/**
 * Shrinks a photo in the browser before upload: phones produce 4–12 MB images,
 * market Wi-Fi is slow, and a shop only needs ~1600px.
 */
export async function resizeImage(
  file: File,
  opts: { max?: number; quality?: number; keepAlpha?: boolean; png?: boolean } = {},
): Promise<{ blob: Blob; width: number; height: number; type: string }> {
  const max = opts.max ?? 1600;
  const quality = opts.quality ?? 0.84;

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  if (!opts.keepAlpha) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  if ("close" in bitmap && typeof bitmap.close === "function") bitmap.close();

  // Logos stay PNG so share-card generators (which can't read WebP) can embed them.
  let blob = opts.png ? await toBlob(canvas, "image/png", quality) : await toBlob(canvas, "image/webp", quality);
  if (!blob || (!opts.png && blob.type !== "image/webp")) {
    blob = await toBlob(canvas, opts.keepAlpha ? "image/png" : "image/jpeg", quality);
  }
  if (!blob) throw new Error("Couldn't process that image. Try a different photo.");
  return { blob, width, height, type: blob.type };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Upload a resized image to the app. Returns its public URL. */
export async function uploadImage(file: File, kind: "logo" | "cover" | "listing") {
  const resized = await resizeImage(file, {
    max: kind === "logo" ? 600 : kind === "cover" ? 2000 : 1600,
    keepAlpha: kind === "logo",
    png: kind === "logo",
  });
  const ext = resized.type.split("/")[1] === "jpeg" ? "jpg" : resized.type.split("/")[1];
  const body = new FormData();
  body.append("kind", kind);
  body.append("file", new File([resized.blob], `upload.${ext}`, { type: resized.type }));
  const res = await fetch("/api/upload", { method: "POST", body });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error || "Upload failed. Check your connection and try again.");
  return { url: data.url, width: resized.width, height: resized.height };
}
