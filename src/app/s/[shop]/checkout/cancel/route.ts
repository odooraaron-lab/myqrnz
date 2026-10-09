import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { rootUrl, shopUrl } from "@/config/site";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { cancelPendingOrder } from "@/lib/orders";
import { getShopBySubdomain, storefrontBase } from "@/lib/shops";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/** The buyer backed out of Stripe Checkout: end the session and put the item back. */
export async function GET(request: Request, ctx: { params: Promise<{ shop: string }> }) {
  const { shop: sub } = await ctx.params;
  const token = new URL(request.url).searchParams.get("o") ?? "";
  const shop = await getShopBySubdomain(sub);
  const base = await storefrontBase(sub);
  const home = base === "" ? shopUrl(sub, "/") : rootUrl(`/s/${sub}`);
  if (!shop || !token) return NextResponse.redirect(home);

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.shopId, shop.id), eq(orders.publicToken, token)))
    .limit(1);
  if (!order) return NextResponse.redirect(home);

  if (order.status === "pending") {
    if (order.stripeSessionId) {
      try {
        await stripe().checkout.sessions.expire(order.stripeSessionId);
      } catch {
        /* already completed or expired — the webhook has the final say */
      }
    }
    const [fresh] = await db.select().from(orders).where(eq(orders.id, order.id)).limit(1);
    if (fresh?.status === "pending") await cancelPendingOrder(fresh);
  }

  const path = order.itemSlug ? `/p/${order.itemSlug}?checkout=cancelled` : "/";
  return NextResponse.redirect(base === "" ? shopUrl(sub, path) : rootUrl(`/s/${sub}${path}`));
}
