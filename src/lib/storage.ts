import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { put, del } from "@vercel/blob";
import { randomToken } from "./auth";

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), ".data", "uploads");

export class UploadError extends Error {}

/**
 * Stores an image and returns its public URL.
 * Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise writes to
 * .data/uploads (served at /uploads/…) outside production.
 */
export async function storeImage(file: File, folder: string, opts: { allowSvg?: boolean } = {}): Promise<string> {
  const ext = ALLOWED[file.type];
  if (!ext || (ext === "svg" && !opts.allowSvg)) {
    throw new UploadError("Use a JPG, PNG or WebP image.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("That image is over 6 MB. Try a smaller photo.");
  }

  const name = `${folder}/${randomToken(12)}.${ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, file, {
      access: "public",
      contentType: file.type,
      addRandomSuffix: false,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    return blob.url;
  }

  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_LOCAL_UPLOADS) {
    throw new UploadError("Photo storage isn't set up yet. Connect a Vercel Blob store to the project.");
  }

  const target = path.join(LOCAL_UPLOAD_DIR, name);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

/** Best-effort delete; a leftover file is not worth failing a request over. */
export async function removeImage(url: string | null | undefined) {
  if (!url) return;
  try {
    if (url.includes(".blob.vercel-storage.com") && process.env.BLOB_READ_WRITE_TOKEN) {
      await del(url);
    }
  } catch (err) {
    console.warn("[storage] could not delete", url, err);
  }
}
