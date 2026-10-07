import "server-only";
import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { listingImages, listings, shops, shopVisits, type Listing, type ListingImage, type Shop } from "@/db/schema";
import { nzToday } from "./format";

export type ListingWithImages = Listing & { images: ListingImage[] };

export const getShopBySubdomain = cache(async (subdomain: string): Promise<Shop | null> => {
  if (!/^[a-z0-9-]{1,40}$/.test(subdomain)) return null;
  const rows = await db.select().from(shops).where(eq(shops.subdomain, subdomain)).limit(1);
  return rows[0] ?? null;
});

export async function isSubdomainTaken(subdomain: string) {
  const rows = await db.select({ id: shops.id }).from(shops).where(eq(shops.subdomain, subdomain)).limit(1);
  return rows.length > 0;
}

async function attachImages(rows: Listing[]): Promise<ListingWithImages[]> {
  if (rows.length === 0) return [];
  const imgs = await db
    .select()
    .from(listingImages)
    .where(inArray(listingImages.listingId, rows.map((r) => r.id)))
    .orderBy(asc(listingImages.position), asc(listingImages.createdAt));
  const byListing = new Map<string, ListingImage[]>();
  for (const img of imgs) {
    const list = byListing.get(img.listingId) ?? [];
    list.push(img);
    byListing.set(img.listingId, list);
  }
  return rows.map((r) => ({ ...r, images: byListing.get(r.id) ?? [] }));
}

/** Items a shopper can see: for sale, and sold items kept up as a record. */
export const getPublicListings = cache(async (shopId: string): Promise<ListingWithImages[]> => {
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.shopId, shopId), inArray(listings.status, ["active", "sold"])))
    .orderBy(
      sql`case when ${listings.status} = 'sold' then 1 else 0 end`,
      asc(listings.sortOrder),
      desc(listings.createdAt),
    );
  return attachImages(rows);
});

export const getPublicListing = cache(async (shopId: string, slug: string): Promise<ListingWithImages | null> => {
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.shopId, shopId), eq(listings.slug, slug), inArray(listings.status, ["active", "sold"])))
    .limit(1);
  const [withImages] = await attachImages(rows);
  return withImages ?? null;
});

export async function getAllListingsForShop(shopId: string): Promise<ListingWithImages[]> {
  const rows = await db
    .select()
    .from(listings)
    .where(eq(listings.shopId, shopId))
    .orderBy(asc(listings.sortOrder), desc(listings.createdAt));
  return attachImages(rows);
}

export async function getListingForShop(shopId: string, id: string): Promise<ListingWithImages | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.shopId, shopId), eq(listings.id, id)))
    .limit(1);
  const [withImages] = await attachImages(rows);
  return withImages ?? null;
}

/** Path prefix for links inside a storefront: "" on a shop subdomain, "/s/name" on the main domain. */
export async function storefrontBase(subdomain: string) {
  const h = await headers();
  const base = h.get("x-myqr-shop-base");
  if (base !== null && h.get("x-myqr-shop") === subdomain) return base;
  return `/s/${subdomain}`;
}

const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|lighthouse|headless/i;

export async function recordVisit(shopId: string, source: "qr" | "web", userAgent: string | null) {
  if (userAgent && BOT.test(userAgent)) return;
  try {
    await db
      .insert(shopVisits)
      .values({ shopId, day: nzToday(), source, count: 1 })
      .onConflictDoUpdate({
        target: [shopVisits.shopId, shopVisits.day, shopVisits.source],
        set: { count: sql`${shopVisits.count} + 1` },
      });
  } catch (err) {
    console.warn("[visits] could not record", err);
  }
}

export async function shopCategories(shopId: string) {
  const rows = await db
    .selectDistinct({ category: listings.category })
    .from(listings)
    .where(and(eq(listings.shopId, shopId), isNotNull(listings.category)))
    .orderBy(asc(listings.category));
  return rows.map((r) => r.category!).filter(Boolean);
}
