"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/forms";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { orderUpdateEmail, sendEmail } from "@/lib/email";
import { parsePrice } from "@/lib/format";
import { refundOrder, trackUrl } from "@/lib/orders";
import { stripeErrorMessage } from "@/lib/stripe";

async function ownOrder(id: string) {
  const { shop } = await requireSeller();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [order] = await db.select().from(orders).where(and(eq(orders.id, id), eq(orders.shopId, shop.id))).limit(1);
  return order ? { order, shop } : null;
}

// Tracking pages we can link to from a number alone. Others: the seller pastes a link.
const COURIER_LINKS: Record<string, (n: string) => string> = {
  "NZ Post": (n) => `https://www.nzpost.co.nz/tools/tracking/item/${encodeURIComponent(n)}`,
  CourierPost: (n) => `https://www.nzpost.co.nz/tools/tracking/item/${encodeURIComponent(n)}`,
};

export async function markShippedAction(_prev: FormState, form: FormData): Promise<FormState> {
  const found = await ownOrder(String(form.get("id") ?? ""));
  if (!found) return { message: "Order not found." };
  const { order, shop } = found;
  const courier = String(form.get("courier") ?? "").trim().slice(0, 40) || null;
  const trackingNumber = String(form.get("trackingNumber") ?? "").trim().slice(0, 60) || null;
  const pasted = String(form.get("trackingUrl") ?? "").trim();
  const trackingUrl = /^https:\/\/\S+$/i.test(pasted)
    ? pasted.slice(0, 300)
    : courier && trackingNumber && COURIER_LINKS[courier]
      ? COURIER_LINKS[courier](trackingNumber)
      : null;

  const [updated] = await db
    .update(orders)
    .set({ status: "shipped", courier, trackingNumber, trackingUrl, shippedAt: order.shippedAt ?? new Date(), updatedAt: new Date() })
    .where(and(eq(orders.id, order.id), inArray(orders.status, ["paid", "shipped"])))
    .returning();
  if (!updated) return { message: "This order can't be marked as sent." };
  if (updated.buyerEmail) {
    const mail = orderUpdateEmail({ kind: "shipped", number: updated.number, shopName: shop.name, itemTitle: updated.itemTitle, trackUrl: trackUrl(shop, updated), courier, trackingNumber, trackingUrl });
    await sendEmail({ to: updated.buyerEmail, replyTo: shop.contactEmail ?? undefined, ...mail });
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: updated.buyerEmail ? "Marked as sent. We've emailed the customer." : "Marked as sent." };
}

export async function markReadyAction(form: FormData) {
  const found = await ownOrder(String(form.get("id") ?? ""));
  if (!found) return;
  const { order, shop } = found;
  const [updated] = await db
    .update(orders)
    .set({ status: "ready", shippedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orders.id, order.id), eq(orders.status, "paid")))
    .returning();
  if (updated?.buyerEmail) {
    const mail = orderUpdateEmail({ kind: "ready", number: updated.number, shopName: shop.name, itemTitle: updated.itemTitle, trackUrl: trackUrl(shop, updated), pickupInfo: shop.pickupInfo });
    await sendEmail({ to: updated.buyerEmail, replyTo: shop.contactEmail ?? undefined, ...mail });
  }
  revalidatePath("/dashboard", "layout");
}

export async function markCompletedAction(form: FormData) {
  const found = await ownOrder(String(form.get("id") ?? ""));
  if (!found) return;
  await db
    .update(orders)
    .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orders.id, found.order.id), inArray(orders.status, ["paid", "shipped", "ready"])));
  revalidatePath("/dashboard", "layout");
}

export async function refundAction(_prev: FormState, form: FormData): Promise<FormState> {
  const found = await ownOrder(String(form.get("id") ?? ""));
  if (!found) return { message: "Order not found." };
  const { order } = found;
  if (!order.paidAt || !order.stripePaymentIntentId) return { message: "Only paid orders can be refunded." };
  const remaining = order.totalCents - order.refundedCents;
  const full = form.get("type") !== "partial";
  const amount = full ? remaining : parsePrice(String(form.get("amount") ?? ""));
  if (!amount || amount <= 0) return { errors: { amount: "Enter an amount to refund." } };
  if (amount > remaining) return { errors: { amount: `You can refund up to $${(remaining / 100).toFixed(2)}.` } };
  try {
    await refundOrder(order, amount, form.get("restock") === "on");
  } catch (err) {
    return { message: `The refund didn't go through: ${stripeErrorMessage(err)}` };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Refunded. The customer has been emailed, and the amount has come out of your balance." };
}

