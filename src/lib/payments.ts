import "server-only";
import type { Shop } from "@/db/schema";

/**
 * Payments are intentionally not wired up yet. Everything that will touch money
 * goes through this file so Stripe can be added in one place:
 *
 * 1. Setup fee — `startSetupCheckout` will create a Stripe Checkout Session for
 *    the one-off fee and return its URL. A webhook (checkout.session.completed)
 *    then sets shops.setup_paid_at and publishes the shop.
 *
 * 2. Seller payouts — Stripe Connect (Express accounts). Each shop gets a
 *    connected account; product checkouts use destination charges with
 *    application_fee_amount = price × site.platformFeePercent.
 *
 * While PAYMENTS_ENABLED is false, shops publish without paying and shoppers
 * send enquiries instead of checking out.
 */

export function setupFeeRequired(shop: Pick<Shop, "setupPaidAt">) {
  return process.env.PAYMENTS_ENABLED === "true" && !shop.setupPaidAt;
}

export async function startSetupCheckout(_shop: Shop): Promise<{ url: string }> {
  throw new Error("Setup fee checkout isn't connected yet. Set PAYMENTS_ENABLED=false until Stripe is added.");
}
