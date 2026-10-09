import "server-only";
import { rootUrl, site } from "@/config/site";
import type { Shop } from "@/db/schema";
import { paymentsLive, stripe } from "./stripe";

/**
 * How money flows:
 *
 * - Shoppers pay through Stripe Checkout on the platform's own Stripe account
 *   (src/lib/orders.ts). The webhook records each sale and the myQR fee in the
 *   seller's ledger (src/lib/money.ts), held for PAYOUT_HOLD_DAYS.
 * - Sellers request a payout from their available balance. The admin sends it
 *   with a Stripe Connect transfer (src/lib/payouts.ts) or pays by bank
 *   transfer and marks it paid.
 * - The one-off setup fee is a separate Checkout payment; paying it publishes
 *   the shop.
 *
 * While PAYMENTS_ENABLED is false, shops publish without paying and shoppers
 * send enquiries instead of checking out.
 */

export function setupFeeRequired(shop: Pick<Shop, "setupPaidAt">) {
  return paymentsLive() && !shop.setupPaidAt;
}

export async function startSetupCheckout(shop: Shop, email: string): Promise<{ url: string }> {
  const session = await stripe().checkout.sessions.create(
    {
      mode: "payment",
      customer_email: email,
      client_reference_id: shop.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "nzd",
            unit_amount: Math.round(site.setupFee * 100),
            product_data: { name: `myQR shop setup: ${shop.subdomain}.${site.rootDomain.split(":")[0]}`, description: "One-off fee. No monthly fees." },
          },
        },
      ],
      metadata: { kind: "setup", shopId: shop.id },
      payment_intent_data: { description: `myQR setup: ${shop.name}`, metadata: { kind: "setup", shopId: shop.id } },
      success_url: rootUrl("/dashboard?published=1"),
      cancel_url: rootUrl("/dashboard#publish"),
      submit_type: "pay",
    },
    { idempotencyKey: `setup_${shop.id}_${Math.floor(Date.now() / 600000)}` },
  );
  if (!session.url) throw new Error("Stripe didn't return a checkout link.");
  return { url: session.url };
}

/**
 * Real QR codes, downloads and printing unlock once the shop is live — and,
 * when payments are on, once the setup fee is paid. Until then every code shown
 * is a watermarked preview that points to myQR, not the shop.
 */
export function qrUnlocked(shop: Pick<Shop, "status" | "setupPaidAt">) {
  return shop.status === "live" && !setupFeeRequired(shop);
}
