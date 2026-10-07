import { shopUrl } from "@/config/site";
import { getShopBySubdomain } from "@/lib/shops";

export async function GET(_req: Request, ctx: { params: Promise<{ shop: string }> }) {
  const { shop: sub } = await ctx.params;
  const shop = await getShopBySubdomain(sub);
  const body =
    shop && shop.status === "live"
      ? `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${shopUrl(sub, "/sitemap.xml")}\n`
      : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
