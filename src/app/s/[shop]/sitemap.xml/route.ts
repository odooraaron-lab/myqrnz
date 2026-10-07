import { shopUrl } from "@/config/site";
import { getPublicListings, getShopBySubdomain } from "@/lib/shops";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Per-request: content depends on the shop and changes as sellers edit.
export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ shop: string }> }) {
  const { shop: sub } = await ctx.params;
  const shop = await getShopBySubdomain(sub);
  if (!shop || shop.status !== "live") return new Response("Not found", { status: 404 });
  const listings = await getPublicListings(shop.id);
  const latest = listings.reduce((d, l) => (l.updatedAt > d ? l.updatedAt : d), shop.updatedAt);

  const urls = [
    { loc: shopUrl(sub, "/"), lastmod: latest, images: [shop.coverUrl, shop.logoUrl] },
    ...listings
      .filter((l) => l.status === "active")
      .map((l) => ({ loc: shopUrl(sub, `/p/${l.slug}`), lastmod: l.updatedAt, images: l.images.map((i) => i.url) })),
  ];
  const abs = (u: string) => (u.startsWith("/") ? shopUrl(sub, u) : u);

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n    <loc>${esc(u.loc)}</loc>\n    <lastmod>${u.lastmod.toISOString()}</lastmod>\n` +
          (u.images.filter(Boolean) as string[]).map((i) => `    <image:image><image:loc>${esc(abs(i))}</image:loc></image:image>\n`).join("") +
          `  </url>`,
      )
      .join("\n") +
    `\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
