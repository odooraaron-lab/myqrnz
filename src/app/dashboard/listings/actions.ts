"use server";

import { and, eq, inArray, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/forms";
import { db } from "@/db";
import { listingImages, listings } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { parsePrice, slugify } from "@/lib/format";
import { getListingForShop } from "@/lib/shops";
import { MAX_PHOTOS } from "@/lib/limits";
import { removeImage } from "@/lib/storage";

const STATUSES = ["active", "draft", "hidden", "sold"] as const;

type Photo = { url: string; width: number | null; height: number | null };

function parsePhotos(raw: FormDataEntryValue | null): Photo[] {
  try {
    const list = JSON.parse(String(raw ?? "[]")) as unknown[];
    return list
      .map((p) => p as Partial<Photo>)
      .filter(
        (p): p is Photo =>
          typeof p.url === "string" &&
          (p.url.startsWith("/uploads/") || /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(p.url)),
      )
      .slice(0, MAX_PHOTOS)
      .map((p) => ({ url: p.url, width: Number(p.width) || null, height: Number(p.height) || null }));
  } catch {
    return [];
  }
}

async function uniqueSlug(shopId: string, title: string) {
  const base = slugify(title);
  const taken = await db
    .select({ slug: listings.slug })
    .from(listings)
    .where(and(eq(listings.shopId, shopId), or(eq(listings.slug, base), like(listings.slug, `${base}-%`))));
  const used = new Set(taken.map((t) => t.slug));
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((v) => (v === "" ? null : v));

export async function saveListingAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { shop } = await requireSeller();
  const id = String(form.get("id") ?? "") || null;
  const existing = id ? await getListingForShop(shop.id, id) : null;
  if (id && !existing) return { message: "This product no longer exists." };

  const errors: Record<string, string> = {};
  const fields = z
    .object({
      title: z.string().trim().min(2, "Give your product a name.").max(120, "Keep the name under 120 characters."),
      description: text(4000),
      category: text(40),
      status: z.enum(STATUSES),
      seoTitle: text(70),
      seoDescription: text(170),
    })
    .safeParse({
      title: form.get("title") ?? "",
      description: form.get("description") ?? "",
      category: form.get("category") ?? "",
      status: form.get("status") ?? "active",
      seoTitle: form.get("seoTitle") ?? "",
      seoDescription: form.get("seoDescription") ?? "",
    });
  if (!fields.success) for (const i of fields.error.issues) errors[String(i.path[0])] ??= i.message;

  const priceCents = parsePrice(String(form.get("price") ?? ""));
  if (priceCents === null) errors.price = "Enter a price, like 24 or 24.50.";
  else if (priceCents > 10_000_000) errors.price = "That price is higher than we support.";

  const delivery = String(form.get("delivery") ?? "ship");
  let shippingCents: number | null = null;
  if (delivery === "ship") {
    shippingCents = parsePrice(String(form.get("shipping") ?? ""));
    if (shippingCents === null) errors.shipping = "Enter a shipping price, or 0 for free shipping.";
  }
  const pickup = delivery === "pickup" || form.get("pickup") === "on";

  const stock = String(form.get("stock") ?? "one");
  let quantity: number | null = 1;
  if (stock === "unlimited") quantity = null;
  else if (stock === "count") {
    const n = Number(form.get("quantity"));
    if (!Number.isInteger(n) || n < 0 || n > 100000) errors.quantity = "Enter how many you have, as a whole number.";
    else quantity = n;
  }

  const photos = parsePhotos(form.get("photos"));

  if (Object.keys(errors).length || !fields.success) {
    return { message: "Check the highlighted fields.", errors };
  }
  const f = fields.data;
  // A product that runs out of stock shows as sold.
  const status = quantity === 0 && f.status === "active" ? "sold" : f.status;

  let listingId = existing?.id;
  const values = {
    title: f.title,
    description: f.description,
    category: f.category,
    priceCents: priceCents!,
    shippingCents,
    pickup,
    quantity,
    status,
    seoTitle: f.seoTitle,
    seoDescription: f.seoDescription,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(listings).set(values).where(eq(listings.id, existing.id));
  } else {
    const [row] = await db
      .insert(listings)
      .values({ ...values, shopId: shop.id, slug: await uniqueSlug(shop.id, f.title) })
      .returning({ id: listings.id });
    listingId = row.id;
  }

  // Replace the photo set, then tidy up files that were removed.
  const before = existing?.images.map((i) => i.url) ?? [];
  await db.delete(listingImages).where(eq(listingImages.listingId, listingId!));
  if (photos.length) {
    await db.insert(listingImages).values(
      photos.map((p, i) => ({ listingId: listingId!, url: p.url, width: p.width, height: p.height, position: i, alt: f.title })),
    );
  }
  const kept = new Set(photos.map((p) => p.url));
  await Promise.all(before.filter((u) => !kept.has(u)).map((u) => removeImage(u)));

  revalidatePath("/dashboard", "layout");
  if (!existing) redirect(`/dashboard/listings/${listingId}?created=1`);
  return { ok: true, message: "Product saved." };
}

export async function setListingStatusAction(form: FormData) {
  const { shop } = await requireSeller();
  const id = String(form.get("id") ?? "");
  const status = String(form.get("status") ?? "") as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) return;
  await db
    .update(listings)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(listings.id, id), eq(listings.shopId, shop.id)));
  revalidatePath("/dashboard", "layout");
}

export async function deleteListingAction(form: FormData) {
  const { shop } = await requireSeller();
  const id = String(form.get("id") ?? "");
  const listing = await getListingForShop(shop.id, id);
  if (!listing) redirect("/dashboard/listings");
  await db.delete(listings).where(eq(listings.id, listing.id));
  await Promise.all(listing.images.map((i) => removeImage(i.url)));
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/listings?deleted=1");
}

/** Saves a new display order from the products list. */
export async function reorderListingsAction(ids: string[]) {
  const { shop } = await requireSeller();
  const valid = await db
    .select({ id: listings.id })
    .from(listings)
    .where(and(eq(listings.shopId, shop.id), inArray(listings.id, ids)));
  const ok = new Set(valid.map((v) => v.id));
  await Promise.all(
    ids.filter((i) => ok.has(i)).map((id, index) => db.update(listings).set({ sortOrder: index }).where(eq(listings.id, id))),
  );
  revalidatePath("/dashboard/listings");
}
