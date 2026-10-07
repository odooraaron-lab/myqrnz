import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

let cached: { name: string; data: Buffer; weight: 500 | 800; style: "normal" }[] | null = null;

/** Archivo for social share images (Satori needs .woff, not .woff2). */
export async function ogFonts() {
  if (cached) return cached;
  const [regular, bold] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/archivo-latin-500-normal.woff")),
    readFile(join(process.cwd(), "assets/fonts/archivo-latin-800-normal.woff")),
  ]);
  cached = [
    { name: "Archivo", data: regular, weight: 500, style: "normal" },
    { name: "Archivo", data: bold, weight: 800, style: "normal" },
  ];
  return cached;
}

export const OG_SIZE = { width: 1200, height: 630 };
