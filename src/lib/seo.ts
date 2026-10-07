import type { Listing, Shop } from "@/db/schema";
import { formatPrice, truncate } from "./format";

/** Search titles and descriptions, written from shop details unless the seller overrides them. */

export function shopSeoTitle(shop: Pick<Shop, "name" | "tagline" | "location" | "seoTitle">) {
  if (shop.seoTitle?.trim()) return shop.seoTitle.trim();
  const name = shop.name.trim();
  const tagline = shop.tagline?.trim();
  const where = shop.location?.trim();
  // First candidate that fits in a Google title wins.
  const candidates = [
    tagline && `${name} | ${tagline}`,
    where && `${name} | Shop online from ${where}`,
    `${name} | Shop online`,
  ].filter(Boolean) as string[];
  return candidates.find((c) => c.length <= 62) ?? truncate(name, 62);
}

export function shopSeoDescription(shop: Pick<Shop, "name" | "tagline" | "description" | "location" | "seoDescription">) {
  if (shop.seoDescription?.trim()) return shop.seoDescription.trim();
  const base = shop.description?.trim()
    ? shop.description
    : `${shop.name}${shop.tagline ? ` — ${shop.tagline}` : ""}. Browse and order online${shop.location ? ` from ${shop.location}` : ""}, with pickup or delivery in New Zealand.`;
  return truncate(base, 158);
}

export function listingSeoTitle(listing: Pick<Listing, "title" | "priceCents" | "seoTitle">, shop: Pick<Shop, "name">) {
  if (listing.seoTitle?.trim()) return listing.seoTitle.trim();
  return truncate(`${listing.title} — ${formatPrice(listing.priceCents)} | ${shop.name}`, 70);
}

export function listingSeoDescription(
  listing: Pick<Listing, "title" | "description" | "seoDescription">,
  shop: Pick<Shop, "name" | "location">,
) {
  if (listing.seoDescription?.trim()) return listing.seoDescription.trim();
  const base = listing.description?.trim()
    ? listing.description
    : `${listing.title} from ${shop.name}${shop.location ? ` in ${shop.location}` : ""}. Order online for pickup or NZ delivery.`;
  return truncate(base, 158);
}

export const NZ_REGIONS = [
  "Northland",
  "Auckland",
  "Waikato",
  "Bay of Plenty",
  "Gisborne",
  "Hawke's Bay",
  "Taranaki",
  "Manawatū-Whanganui",
  "Wellington",
  "Tasman",
  "Nelson",
  "Marlborough",
  "West Coast",
  "Canterbury",
  "Otago",
  "Southland",
  "Chatham Islands",
];
