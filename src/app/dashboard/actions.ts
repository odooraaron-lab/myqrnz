"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { FormState } from "@/components/forms";
import { db } from "@/db";
import { listingImages, listings, shops, users } from "@/db/schema";
import {
  createSession,
  destroyAllSessions,
  destroySession,
  hashPassword,
  requireSeller,
  verifyPassword,
} from "@/lib/auth";
import { isEmail } from "@/lib/format";
import { setupFeeRequired, startSetupCheckout } from "@/lib/payments";
import { removeImage } from "@/lib/storage";
import { isHexColor, THEME_IDS } from "@/lib/themes";
import { NZ_REGIONS } from "@/lib/seo";

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((v) => (v === "" ? null : v));

/** Only accept images we stored ourselves. */
function ownImageUrl(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  if (v.startsWith("/uploads/")) return v;
  if (/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i.test(v)) return v;
  return null;
}

function handle(value: string | null, site: "instagram" | "facebook") {
  if (!value) return null;
  const v = value.trim().replace(/^@/, "");
  const m = v.match(new RegExp(`${site}\\.com/([^/?#]+)`, "i"));
  const clean = (m ? m[1] : v).replace(/[^A-Za-z0-9._-]/g, "");
  return clean || null;
}

const shopSchema = z.object({
  name: z.string().trim().min(2, "Enter your shop name.").max(60, "Keep your shop name under 60 characters."),
  tagline: optional(90),
  description: optional(1500),
  theme: z.enum(THEME_IDS, { message: "Choose a design." }),
  accentColor: z
    .string()
    .trim()
    .transform((v) => (isHexColor(v) ? v.toUpperCase() : null)),
  contactEmail: optional(120).refine((v) => v === null || isEmail(v), "Check this email address."),
  showEmail: z.boolean(),
  phone: optional(30),
  location: optional(60),
  region: z
    .string()
    .trim()
    .transform((v) => (NZ_REGIONS.includes(v) ? v : null)),
  marketInfo: optional(400),
  pickupInfo: optional(300),
  instagram: optional(120),
  facebook: optional(160),
  website: optional(200).refine((v) => v === null || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v), "Start the web address with https://"),
  seoTitle: optional(70),
  seoDescription: optional(170),
});

export async function saveShopAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { shop } = await requireSeller();
  const raw = Object.fromEntries(form.entries());
  const parsed = shopSchema.safeParse({
    ...Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? v : ""])),
    showEmail: form.get("showEmail") === "on",
    accentColor: form.get("useAccent") === "on" ? String(form.get("accentColor") ?? "") : "",
  });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { message: "Some details need fixing before this can be saved.", errors };
  }
  const d = parsed.data;
  const logoUrl = ownImageUrl(form.get("logoUrl"));
  const coverUrl = ownImageUrl(form.get("coverUrl"));

  await db
    .update(shops)
    .set({
      ...d,
      instagram: handle(d.instagram, "instagram"),
      facebook: handle(d.facebook, "facebook"),
      logoUrl,
      coverUrl,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shop.id));

  if (shop.logoUrl && shop.logoUrl !== logoUrl) await removeImage(shop.logoUrl);
  if (shop.coverUrl && shop.coverUrl !== coverUrl) await removeImage(shop.coverUrl);

  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Shop saved." };
}

export async function publishShopAction() {
  const { shop } = await requireSeller();
  if (shop.status === "suspended") redirect("/dashboard?error=suspended");
  if (setupFeeRequired(shop)) {
    const { url } = await startSetupCheckout(shop);
    redirect(url);
  }
  await db
    .update(shops)
    .set({ status: "live", publishedAt: shop.publishedAt ?? new Date(), updatedAt: new Date() })
    .where(eq(shops.id, shop.id));
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard?published=1");
}

export async function unpublishShopAction() {
  const { shop } = await requireSeller();
  if (shop.status !== "live") return;
  await db.update(shops).set({ status: "draft", updatedAt: new Date() }).where(eq(shops.id, shop.id));
  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/account?offline=1");
}

// ── Account ─────────────────────────────────────────────────────────────────

export async function changeEmailAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireSeller();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!isEmail(email)) return { errors: { email: "Check this email address." } };
  if (!(await verifyPassword(password, user.passwordHash))) return { errors: { password: "That password isn't right." } };
  if (email === user.email) return { ok: true, message: "That's already your email." };
  const taken = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (taken.length) return { errors: { email: "Another account already uses this email." } };
  await db.update(users).set({ email }).where(eq(users.id, user.id));
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Email updated. Use it next time you log in." };
}

export async function changePasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user } = await requireSeller();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) return { errors: { current: "That password isn't right." } };
  if (next.length < 8) return { errors: { password: "Use at least 8 characters." } };
  await db.update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, user.id));
  await destroyAllSessions(user.id);
  await createSession(user.id);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

export async function signOutEverywhereAction() {
  const { user } = await requireSeller();
  await destroyAllSessions(user.id);
  await destroySession();
  redirect("/login");
}

export async function deleteAccountAction(_prev: FormState, form: FormData): Promise<FormState> {
  const { user, shop } = await requireSeller();
  if (String(form.get("confirm") ?? "").trim().toLowerCase() !== shop.subdomain) {
    return { errors: { confirm: `Type ${shop.subdomain} to confirm.` } };
  }
  if (!(await verifyPassword(String(form.get("password") ?? ""), user.passwordHash))) {
    return { errors: { password: "That password isn't right." } };
  }
  const photos = await db
    .select({ url: listingImages.url })
    .from(listingImages)
    .innerJoin(listings, eq(listings.id, listingImages.listingId))
    .where(eq(listings.shopId, shop.id));
  await Promise.all([shop.logoUrl, shop.coverUrl, ...photos.map((p) => p.url)].map((u) => removeImage(u)));
  await db.delete(users).where(eq(users.id, user.id)); // cascades to shop, products, sessions
  await destroySession();
  redirect("/?deleted=1");
}
