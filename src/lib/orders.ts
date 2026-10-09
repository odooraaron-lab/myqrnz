import "server-only";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { adminEmails, rootUrl, shopUrl } from "@/config/site";
import { db } from "@/db";
import { ledgerEntries, listings, orders, shops, users, type Listing, type Order, type Shop } from "@/db/schema";
import { randomToken } from "./auth";
import { newOrderEmail, orderConfirmationEmail, orderUpdateEmail, sendEmail } from "./email";
import { formatDate } from "./format";
import { addEntries, platformFee, releaseDate } from "./money";
import { paymentsLive, stripe, type Stripe } from "./stripe";

/** How long a checkout holds the item for the buyer. Stripe's minimum is 30 minutes. */
const CHECKOUT_MINUTES = 30;
export const MAX_QTY = 10;

export function trackUrl(shop: Pick<Shop, "subdomain">, order: Pick<Order, "publicToken">) {
  return shopUrl(shop.subdomain, `/order/${order.publicToken}`);
}

function httpsImage(url: string | undefined | null, subdomain: string) {
  if (!url) return null;
  const abs = url.startsWith("/") ? shopUrl(subdomain, url) : url;
  return abs.startsWith("https://") ? abs : null;
}

// ── Stock reservations ─────────────────────────────────────────────────────

/** Puts reserved stock back. Safe to call more than once for the same order. */
async function releaseStock(order: Pick<Order, "id" | "listingId" | "quantity">) {
  const [released] = await db
    .update(orders)
    .set({ stockReserved: false, updatedAt: new Date() })
    .where(and(eq(orders.id, order.id), eq(orders.stockReserved, true)))
    .returning({ id: orders.id });
  if (released && order.listingId) {
    await db
      .update(listings)
      .set({
        quantity: sql`${listings.quantity} + ${order.quantity}`,
        status: sql`case when ${listings.status} = 'sold' then 'active' else ${listings.status} end`,
      })
      .where(and(eq(listings.id, order.listingId), sql`${listings.quantity} is not null`));
  }
}

/** Cancels checkouts that were abandoned and never reported back by Stripe. */
export async function releaseStaleReservations(listingId: string) {
  const stale = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.listingId, listingId),
        eq(orders.status, "pending"),
        lt(orders.createdAt, new Date(Date.now() - (CHECKOUT_MINUTES + 5) * 60 * 1000)),
      ),
    );
  for (const o of stale) await cancelPendingOrder(o);
}

export async function cancelPendingOrder(order: Order) {
  await db
    .update(orders)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
  await releaseStock(order);
}

// ── Checkout ───────────────────────────────────────────────────────────────

export async function startCheckout(opts: {
  shop: Shop;
  listing: Listing & { images: { url: string }[] };
  quantity: number;
  delivery: "post" | "pickup";
}): Promise<{ url: string } | { error: string }> {
  const { shop, listing, delivery } = opts;
  if (!paymentsLive() || shop.status !== "live") return { error: "This shop isn't taking card payments right now." };
  if (listing.status !== "active") return { error: "Sorry, this item is no longer available." };
  if (delivery === "post" && listing.shippingCents === null) return { error: "This item is pickup only." };
  if (delivery === "pickup" && !listing.pickup) return { error: "This item can't be picked up. Choose delivery." };
  const quantity = Math.max(1, Math.min(MAX_QTY, Math.floor(opts.quantity) || 1));

  await releaseStaleReservations(listing.id);

  // Hold the stock while the buyer pays.
  let reserved = false;
  if (listing.quantity !== null) {
    const [row] = await db
      .update(listings)
      .set({ quantity: sql`${listings.quantity} - ${quantity}` })
      .where(and(eq(listings.id, listing.id), eq(listings.status, "active"), sql`${listings.quantity} >= ${quantity}`))
      .returning({ quantity: listings.quantity });
    if (!row) return { error: quantity > 1 ? "There aren't that many left. Try fewer." : "Someone has just bought this. It's sold out." };
    reserved = true;
  }

  const shippingCents = delivery === "post" ? (listing.shippingCents ?? 0) : 0;
  const totalCents = listing.priceCents * quantity + shippingCents;
  const [order] = await db
    .insert(orders)
    .values({
      shopId: shop.id,
      listingId: listing.id,
      itemTitle: listing.title,
      itemSlug: listing.slug,
      unitPriceCents: listing.priceCents,
      quantity,
      shippingCents,
      totalCents,
      platformFeeCents: platformFee(totalCents),
      delivery,
      stockReserved: reserved,
      publicToken: randomToken(18),
    })
    .returning();

  try {
    const image = httpsImage(listing.images[0]?.url, shop.subdomain);
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: order.id,
        line_items: [
          {
            quantity,
            price_data: {
              currency: "nzd",
              unit_amount: listing.priceCents,
              product_data: { name: listing.title, ...(image ? { images: [image] } : {}), metadata: { listingId: listing.id } },
            },
          },
        ],
        ...(delivery === "post"
          ? {
              shipping_address_collection: { allowed_countries: ["NZ"] },
              shipping_options: [
                {
                  shipping_rate_data: {
                    type: "fixed_amount",
                    display_name: shippingCents === 0 ? "Free NZ shipping" : "NZ shipping",
                    fixed_amount: { amount: shippingCents, currency: "nzd" },
                  },
                },
              ],
            }
          : {}),
        phone_number_collection: { enabled: true },
        custom_fields: [
          { key: "note", label: { type: "custom", custom: "Note for the seller" }, type: "text", optional: true, text: { maximum_length: 255 } },
        ],
        custom_text: {
          submit: { message: `Paid to myQR for ${shop.name}. ${delivery === "pickup" ? "You'll collect this item." : "Shipped within New Zealand."}`.slice(0, 1000) },
        },
        metadata: { kind: "order", orderId: order.id, shopId: shop.id },
        payment_intent_data: {
          description: `${shop.name} order #${order.number}`,
          metadata: { kind: "order", orderId: order.id, shopId: shop.id, orderNumber: String(order.number) },
          transfer_group: `order_${order.number}`,
        },
        success_url: shopUrl(shop.subdomain, `/order/${order.publicToken}?paid=1`),
        cancel_url: shopUrl(shop.subdomain, `/checkout/cancel?o=${order.publicToken}`),
        expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_MINUTES * 60 + 60,
        submit_type: "pay",
      },
      { idempotencyKey: `checkout_${order.id}` },
    );
    await db.update(orders).set({ stripeSessionId: session.id }).where(eq(orders.id, order.id));
    if (!session.url) throw new Error("Checkout has no URL");
    return { url: session.url };
  } catch (err) {
    console.error("[checkout] could not start", err);
    await cancelPendingOrder(order);
    return { error: "Card payments aren't working right now. Please try again shortly, or send the seller a message." };
  }
}

// ── Webhook handlers ───────────────────────────────────────────────────────

async function stripeFeeFor(paymentIntentId: string | null) {
  if (!paymentIntentId) return null;
  try {
    const pi = await stripe().paymentIntents.retrieve(paymentIntentId, { expand: ["latest_charge.balance_transaction"] });
    const charge = pi.latest_charge as Stripe.Charge | null;
    const bt = charge && typeof charge === "object" ? (charge.balance_transaction as Stripe.BalanceTransaction | null) : null;
    return bt && typeof bt === "object" ? bt.fee : null;
  } catch (err) {
    console.warn("[orders] could not read Stripe fee", err);
    return null;
  }
}

/** Checkout finished and the money is in. Safe to run more than once. */
export async function markOrderPaid(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId || session.payment_status !== "paid") return;
  const [existing] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!existing) return;

  const piId = typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null);
  const ship = session.collected_information?.shipping_details;
  const note = session.custom_fields?.find((f) => f.key === "note")?.text?.value ?? null;
  const paidAt = existing.paidAt ?? new Date();

  const [updated] = await db
    .update(orders)
    .set({
      status: "paid",
      paidAt,
      stockReserved: false,
      stripeSessionId: session.id,
      stripePaymentIntentId: piId,
      stripeFeeCents: await stripeFeeFor(piId),
      buyerName: session.customer_details?.name ?? ship?.name ?? null,
      buyerEmail: session.customer_details?.email ?? null,
      buyerPhone: session.customer_details?.phone ?? null,
      buyerNote: note,
      shippingAddress: ship
        ? {
            name: ship.name,
            line1: ship.address?.line1,
            line2: ship.address?.line2,
            city: ship.address?.city,
            postalCode: ship.address?.postal_code,
            region: ship.address?.state,
            country: ship.address?.country,
          }
        : null,
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), inArray(orders.status, ["pending", "cancelled"])))
    .returning();

  const order = updated ?? existing;
  const release = releaseDate(paidAt);
  await addEntries([
    {
      shopId: order.shopId,
      orderId: order.id,
      type: "sale",
      amountCents: order.totalCents,
      description: `Sale: order #${order.number}, ${order.itemTitle}${order.quantity > 1 ? ` × ${order.quantity}` : ""}`,
      ref: `sale:${order.id}`,
      availableAt: release,
    },
    {
      shopId: order.shopId,
      orderId: order.id,
      type: "fee",
      amountCents: -order.platformFeeCents,
      description: `myQR fee: order #${order.number}`,
      ref: `fee:${order.id}`,
      availableAt: release,
    },
  ]);

  if (!updated) return; // Already handled earlier.

  // Paid after the checkout expired and the stock was put back: take it again.
  if (existing.status === "cancelled" && order.listingId) {
    await db
      .update(listings)
      .set({ quantity: sql`greatest(${listings.quantity} - ${order.quantity}, 0)` })
      .where(and(eq(listings.id, order.listingId), sql`${listings.quantity} is not null`));
  }
  if (order.listingId) {
    await db
      .update(listings)
      .set({ status: "sold", updatedAt: new Date() })
      .where(and(eq(listings.id, order.listingId), eq(listings.quantity, 0), eq(listings.status, "active")));
  }

  await sendOrderEmails(order);
}

async function sendOrderEmails(order: Order) {
  const [shop] = await db.select().from(shops).where(eq(shops.id, order.shopId)).limit(1);
  if (!shop) return;
  const base = {
    number: order.number,
    shopName: shop.name,
    itemTitle: order.itemTitle,
    quantity: order.quantity,
    unitPriceCents: order.unitPriceCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    delivery: order.delivery,
    trackUrl: trackUrl(shop, order),
  };
  if (order.buyerEmail) {
    const mail = orderConfirmationEmail({ ...base, pickupInfo: shop.pickupInfo });
    await sendEmail({ to: order.buyerEmail, replyTo: shop.contactEmail ?? undefined, ...mail });
  }
  let to = shop.contactEmail;
  if (!to) {
    const [owner] = await db.select({ email: users.email }).from(users).where(eq(users.id, shop.ownerId)).limit(1);
    to = owner?.email ?? null;
  }
  if (to) {
    const mail = newOrderEmail({
      ...base,
      buyerName: order.buyerName ?? "",
      feeCents: order.platformFeeCents,
      orderUrl: rootUrl(`/dashboard/orders/${order.id}`),
      releaseDate: formatDate(releaseDate(order.paidAt ?? new Date())),
    });
    await sendEmail({ to, replyTo: order.buyerEmail ?? undefined, ...mail });
  }
}

/** Checkout expired or was abandoned. */
export async function markCheckoutExpired(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (order && order.status === "pending") await cancelPendingOrder(order);
}

/** Records refunds made from myQR or the Stripe dashboard. Safe to run repeatedly. */
export async function syncRefunds(paymentIntentId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, paymentIntentId)).limit(1);
  if (!order) return null;
  const list = await stripe().refunds.list({ payment_intent: paymentIntentId, limit: 100 });

  let refunded = 0;
  const entries: Parameters<typeof addEntries>[0] = [];
  for (const r of list.data) {
    const share = Math.round((order.platformFeeCents * r.amount) / order.totalCents);
    if (r.status === "succeeded" || r.status === "pending" || r.status === "requires_action") {
      refunded += r.amount;
      entries.push(
        { shopId: order.shopId, orderId: order.id, type: "refund", amountCents: -r.amount, description: `Refund: order #${order.number}`, ref: `refund:${r.id}` },
        { shopId: order.shopId, orderId: order.id, type: "fee_refund", amountCents: share, description: `myQR fee returned: order #${order.number}`, ref: `fee_refund:${r.id}` },
      );
    } else if (r.status === "failed" || r.status === "canceled") {
      // Undo a refund we recorded earlier that then failed.
      const [seen] = await db.select({ id: ledgerEntries.id }).from(ledgerEntries).where(eq(ledgerEntries.ref, `refund:${r.id}`)).limit(1);
      if (seen) {
        entries.push(
          { shopId: order.shopId, orderId: order.id, type: "adjustment", amountCents: r.amount, description: `Refund failed: order #${order.number}`, ref: `refund_failed:${r.id}` },
          { shopId: order.shopId, orderId: order.id, type: "adjustment", amountCents: -share, description: `myQR fee: order #${order.number}`, ref: `fee_refund_failed:${r.id}` },
        );
      }
    }
  }
  await addEntries(entries);

  const fullyRefunded = refunded >= order.totalCents;
  const [updated] = await db
    .update(orders)
    .set({
      refundedCents: refunded,
      status: fullyRefunded ? "refunded" : order.status,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, order.id))
    .returning();
  return { before: order, after: updated };
}

export async function refundOrder(order: Order, amountCents: number, restock: boolean) {
  if (!order.stripePaymentIntentId) throw new Error("This order has no card payment to refund.");
  const remaining = order.totalCents - order.refundedCents;
  const amount = Math.min(Math.max(1, Math.round(amountCents)), remaining);
  if (amount <= 0) throw new Error("This order has already been refunded in full.");
  await stripe().refunds.create(
    { payment_intent: order.stripePaymentIntentId, amount, reason: "requested_by_customer", metadata: { orderId: order.id } },
    { idempotencyKey: `refund_${order.id}_${order.refundedCents}_${amount}` },
  );
  const result = await syncRefunds(order.stripePaymentIntentId);
  if (restock && order.listingId) {
    await db
      .update(listings)
      .set({
        quantity: sql`${listings.quantity} + ${order.quantity}`,
        status: sql`case when ${listings.status} = 'sold' then 'active' else ${listings.status} end`,
      })
      .where(and(eq(listings.id, order.listingId), sql`${listings.quantity} is not null`));
  }
  const [shop] = await db.select().from(shops).where(eq(shops.id, order.shopId)).limit(1);
  if (shop && order.buyerEmail) {
    const mail = orderUpdateEmail({ kind: "refunded", number: order.number, shopName: shop.name, itemTitle: order.itemTitle, trackUrl: trackUrl(shop, order), refundCents: amount });
    await sendEmail({ to: order.buyerEmail, ...mail });
  }
  return result;
}

/** A customer disputed the charge with their bank: hold the money back from the seller. */
export async function recordDispute(dispute: Stripe.Dispute, closed: boolean) {
  const piId = typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;
  if (!piId) return;
  const [order] = await db.select().from(orders).where(eq(orders.stripePaymentIntentId, piId)).limit(1);
  if (!order) return;
  if (!closed) {
    await addEntries([
      { shopId: order.shopId, orderId: order.id, type: "dispute", amountCents: -dispute.amount, description: `Card dispute opened: order #${order.number}`, ref: `dispute:${dispute.id}` },
    ]);
    await db.update(orders).set({ disputed: true, updatedAt: new Date() }).where(eq(orders.id, order.id));
  } else {
    if (dispute.status === "won") {
      await addEntries([
        { shopId: order.shopId, orderId: order.id, type: "dispute_won", amountCents: dispute.amount, description: `Card dispute won: order #${order.number}`, ref: `dispute_won:${dispute.id}` },
      ]);
    }
    await db.update(orders).set({ disputed: false, updatedAt: new Date() }).where(eq(orders.id, order.id));
  }
}

// ── Setup fee ──────────────────────────────────────────────────────────────

export async function markSetupPaid(session: Stripe.Checkout.Session) {
  const shopId = session.metadata?.shopId;
  if (!shopId || session.payment_status !== "paid") return;
  await db
    .update(shops)
    .set({ setupPaidAt: new Date(), status: "live", publishedAt: sql`coalesce(${shops.publishedAt}, now())`, updatedAt: new Date() })
    .where(and(eq(shops.id, shopId), sql`${shops.setupPaidAt} is null`, sql`${shops.status} <> 'suspended'`));
}

export function adminRecipients() {
  return adminEmails();
}
