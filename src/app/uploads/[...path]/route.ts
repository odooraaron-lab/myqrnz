import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";

// Serves images saved locally when no Vercel Blob store is configured (development).
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

// Per-request: content depends on the shop and changes as sellers edit.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const parts = (await ctx.params).path;
  const file = path.normalize(path.join(LOCAL_UPLOAD_DIR, ...parts));
  if (!file.startsWith(LOCAL_UPLOAD_DIR)) return new Response("Not found", { status: 404 });
  try {
    const data = await readFile(file);
    return new Response(new Uint8Array(data), {
      headers: {
        "content-type": TYPES[path.extname(file)] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
