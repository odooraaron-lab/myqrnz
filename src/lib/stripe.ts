import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

/** Card checkout is on when PAYMENTS_ENABLED=true and a secret key is set. */
export function paymentsLive() {
  return process.env.PAYMENTS_ENABLED === "true" && !!process.env.STRIPE_SECRET_KEY;
}

/** Payouts through Stripe Connect (sellers verify once, Stripe pays their bank). */
export function connectEnabled() {
  return paymentsLive() && process.env.STRIPE_CONNECT_ENABLED === "true";
}

export function stripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  // STRIPE_API_HOST etc. point the SDK at a local mock for testing.
  const host = process.env.STRIPE_API_HOST;
  client = new Stripe(key, {
    appInfo: { name: "myQR" },
    maxNetworkRetries: 2,
    ...(host
      ? {
          host,
          port: process.env.STRIPE_API_PORT ? Number(process.env.STRIPE_API_PORT) : undefined,
          protocol: (process.env.STRIPE_API_PROTOCOL as "http" | "https" | undefined) ?? "https",
        }
      : {}),
  });
  return client;
}

/** A friendly message for Stripe errors shown in the admin. */
export function stripeErrorMessage(err: unknown) {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: string }).message);
  return "Stripe didn't respond. Try again.";
}

export type { Stripe };
