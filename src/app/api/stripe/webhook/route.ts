import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { shops, stripeEvents } from "@/db/schema";
import { markCheckoutExpired, markOrderPaid, markSetupPaid, recordDispute, syncRefunds } from "@/lib/orders";
import { stripe, type Stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Add this URL in Stripe → Developers → Webhooks:
 *   https://myqr.co.nz/api/stripe/webhook
 * Events: checkout.session.completed, checkout.session.async_payment_succeeded,
 * checkout.session.expired, charge.refunded, charge.refund.updated,
 * charge.dispute.created, charge.dispute.closed, and (for Connect payouts,
 * as a "connected accounts" endpoint) account.updated.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(Boolean) as string[];
  if (!signature || !secrets.length) return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });

  let event: Stripe.Event | null = null;
  for (const secret of secrets) {
    try {
      event = stripe().webhooks.constructEvent(body, signature, secret);
      break;
    } catch {
      /* try the next secret */
    }
  }
  if (!event) return NextResponse.json({ error: "Bad signature" }, { status: 400 });

  const [seen] = await db.select({ id: stripeEvents.id }).from(stripeEvents).where(eq(stripeEvents.id, event.id)).limit(1);
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  try {
    await handle(event);
  } catch (err) {
    console.error(`[stripe] ${event.type} failed`, err);
    // A 500 makes Stripe retry later. Every handler is safe to repeat.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  await db.insert(stripeEvents).values({ id: event.id, type: event.type }).onConflictDoNothing();
  return NextResponse.json({ received: true });
}

async function handle(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.metadata?.kind === "setup") await markSetupPaid(session);
      else if (session.metadata?.kind === "order") await markOrderPaid(session);
      return;
    }
    case "checkout.session.expired":
      if (event.data.object.metadata?.kind === "order") await markCheckoutExpired(event.data.object);
      return;
    case "charge.refunded":
    case "charge.refund.updated": {
      const obj = event.data.object as Stripe.Charge | Stripe.Refund;
      const pi = typeof obj.payment_intent === "string" ? obj.payment_intent : obj.payment_intent?.id;
      if (pi) await syncRefunds(pi);
      return;
    }
    case "charge.dispute.created":
      await recordDispute(event.data.object, false);
      return;
    case "charge.dispute.closed":
      await recordDispute(event.data.object, true);
      return;
    case "account.updated": {
      const account = event.data.object;
      await db
        .update(shops)
        .set({ stripePayoutsReady: account.payouts_enabled === true && account.capabilities?.transfers === "active" })
        .where(eq(shops.stripeAccountId, account.id));
      return;
    }
    default:
      return;
  }
}
