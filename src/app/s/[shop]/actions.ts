"use server";

import { and, count, eq, gt } from "drizzle-orm";
import { z } from "zod";
import type { FormState } from "@/components/forms";
import { rootUrl, shopUrl } from "@/config/site";
import { db } from "@/db";
import { enquiries, listings, users } from "@/db/schema";
import { enquiryEmail, sendEmail } from "@/lib/email";
import { getShopBySubdomain } from "@/lib/shops";

const schema = z.object({
  name: z.string().trim().min(1, "Tell the seller your name.").max(80),
  email: z.string().trim().toLowerCase().email("Check your email address so the seller can reply."),
  phone: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v || null),
  message: z.string().trim().min(5, "Write a short message.").max(2000, "Keep your message under 2000 characters."),
});

export async function sendEnquiryAction(_prev: FormState, form: FormData): Promise<FormState> {
  const subdomain = String(form.get("shop") ?? "");
  const shop = await getShopBySubdomain(subdomain);
  if (!shop || shop.status !== "live") return { message: "This shop isn't taking messages right now." };

  // Spam traps: a hidden field people never fill, and forms sent within 3 seconds of loading.
  const started = Number(form.get("t") ?? 0);
  if (String(form.get("company") ?? "") !== "" || (started && Date.now() - started < 3000)) {
    return { ok: true, message: "Thanks — your message has been sent." };
  }

  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    message: String(form.get("message") ?? ""),
  };
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const i of parsed.error.issues) errors[String(i.path[0])] ??= i.message;
    return { errors, values };
  }
  const d = parsed.data;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(enquiries)
    .where(and(eq(enquiries.shopId, shop.id), eq(enquiries.email, d.email), gt(enquiries.createdAt, hourAgo)));
  if (recent >= 5) {
    return { message: "You've sent several messages already. The seller will be in touch — try again later if needed.", values };
  }

  let listing: { id: string; title: string; slug: string } | null = null;
  const listingId = String(form.get("listingId") ?? "");
  if (/^[0-9a-f-]{36}$/i.test(listingId)) {
    const [row] = await db
      .select({ id: listings.id, title: listings.title, slug: listings.slug })
      .from(listings)
      .where(and(eq(listings.id, listingId), eq(listings.shopId, shop.id)))
      .limit(1);
    listing = row ?? null;
  }

  const delivery = String(form.get("delivery") ?? "");
  if (delivery === "post") d.message = `${d.message}\n\nDelivery: please post it to me.`;
  if (delivery === "pickup") d.message = `${d.message}\n\nDelivery: I'll pick it up.`;

  await db.insert(enquiries).values({ shopId: shop.id, listingId: listing?.id ?? null, ...d });

  let to = shop.contactEmail;
  if (!to) {
    const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, shop.ownerId)).limit(1);
    to = owner?.email ?? null;
  }
  if (to) {
    const mail = enquiryEmail({
      shopName: shop.name,
      fromName: d.name,
      fromEmail: d.email,
      phone: d.phone,
      message: d.message,
      itemTitle: listing?.title,
      itemUrl: listing ? shopUrl(shop.subdomain, `/p/${listing.slug}`) : null,
      inboxUrl: rootUrl("/dashboard/enquiries"),
    });
    await sendEmail({ to, replyTo: d.email, ...mail });
  }

  return {
    ok: true,
    message: `Sent. ${shop.name} will reply to ${d.email}.`,
  };
}
