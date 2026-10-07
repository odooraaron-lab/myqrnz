import "server-only";
import type { Metadata } from "next";
import { shopUrl } from "@/config/site";
import type { Shop } from "@/db/schema";
import { getCurrentUser } from "./auth";
import { getShopBySubdomain, storefrontBase } from "./shops";
import { getTheme } from "./themes";

export type StorefrontContext = {
  shop: Shop;
  /** Link prefix inside the storefront ("" on the shop's own subdomain). */
  base: string;
  /** True when shown at myqr.co.nz/s/<name> rather than on the subdomain. */
  isPathPreview: boolean;
  /** The signed-in owner looking at their own shop. */
  isOwner: boolean;
  /** Whether the public can see it. */
  isPublic: boolean;
};

export async function loadStorefront(subdomain: string): Promise<StorefrontContext | null> {
  const shop = await getShopBySubdomain(subdomain);
  if (!shop) return null;
  const base = await storefrontBase(subdomain);
  const isPathPreview = base !== "";
  // Session cookies only exist on the main domain, so owners preview via /s/<name>.
  const user = isPathPreview ? await getCurrentUser() : null;
  return {
    shop,
    base,
    isPathPreview,
    isOwner: !!user && user.id === shop.ownerId,
    isPublic: shop.status === "live",
  };
}

/** Absolute URL for an image, so share cards and structured data work off-site. */
export function absoluteAsset(subdomain: string, url: string | null | undefined) {
  if (!url) return undefined;
  return url.startsWith("/") ? shopUrl(subdomain, url) : url;
}

export function baseShopMetadata(ctx: StorefrontContext): Metadata {
  const { shop } = ctx;
  const theme = getTheme(shop.theme);
  return {
    metadataBase: new URL(shopUrl(shop.subdomain)),
    applicationName: shop.name,
    icons: shop.logoUrl ? { icon: absoluteAsset(shop.subdomain, shop.logoUrl), apple: absoluteAsset(shop.subdomain, shop.logoUrl) } : undefined,
    robots: ctx.isPublic && !ctx.isPathPreview ? { index: true, follow: true } : { index: false, follow: false },
    other: { "theme-color": theme.colors.bg },
  };
}

export function socialLinks(shop: Shop) {
  return [
    shop.instagram && { label: "Instagram", href: `https://instagram.com/${shop.instagram}` },
    shop.facebook && { label: "Facebook", href: `https://facebook.com/${shop.facebook}` },
    shop.website && { label: "Website", href: shop.website },
  ].filter(Boolean) as { label: string; href: string }[];
}
