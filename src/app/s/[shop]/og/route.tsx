import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { shopHost } from "@/config/site";
import { LOCAL_UPLOAD_DIR } from "@/lib/storage";
import { OG_SIZE, ogFonts } from "@/lib/og";
import { getShopBySubdomain } from "@/lib/shops";
import { getTheme, isHexColor } from "@/lib/themes";

/** Share card for a shop: its name, tagline and colours. */
// Per-request: content depends on the shop and changes as sellers edit.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ shop: string }> }) {
  const { shop: sub } = await ctx.params;
  const shop = await getShopBySubdomain(sub);
  if (!shop || shop.status === "suspended") return new Response("Not found", { status: 404 });
  const theme = getTheme(shop.theme);
  const accent = isHexColor(shop.accentColor) ? shop.accentColor : theme.colors.accent;
  const embedLogo = await logoDataUrl(shop.logoUrl);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: theme.colors.bg,
          color: theme.colors.text,
          padding: 80,
          fontFamily: "Archivo",
          borderBottom: `24px solid ${accent}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {embedLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={embedLogo} width={120} height={120} style={{ objectFit: "contain" }} alt="" />
          )}
          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: theme.colors.muted }}>
            {[shop.location, shop.region].filter(Boolean).join(", ") || "Shop online"}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: shop.name.length > 24 ? 76 : 96, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            {shop.name}
          </div>
          {shop.tagline && (
            <div style={{ display: "flex", fontSize: 36, fontWeight: 500, color: theme.colors.muted, marginTop: 20 }}>{shop.tagline}</div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 28, fontWeight: 800 }}>{shopHost(sub)}</div>
      </div>
    ),
    { ...OG_SIZE, fonts: await ogFonts(), headers: { "cache-control": "public, max-age=3600" } },
  );
}

/** Inlines the logo as a data URL. Satori can't decode WebP, so only PNG/JPEG are used. */
async function logoDataUrl(url: string | null): Promise<string | null> {
  if (!url || !/\.(png|jpe?g)(\?|$)/i.test(url)) return null;
  const type = /\.png/i.test(url) ? "image/png" : "image/jpeg";
  try {
    let data: Buffer;
    if (url.startsWith("/uploads/")) {
      const file = path.normalize(path.join(LOCAL_UPLOAD_DIR, url.slice("/uploads/".length)));
      if (!file.startsWith(LOCAL_UPLOAD_DIR)) return null;
      data = await readFile(file);
    } else if (/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(url)) {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return null;
      data = Buffer.from(await res.arrayBuffer());
    } else {
      return null;
    }
    return `data:${type};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}
