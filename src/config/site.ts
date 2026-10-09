/**
 * Platform-wide settings. Pricing values here drive the marketing pages,
 * structured data and the dashboard, so change them in one place.
 */

const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").toLowerCase();
const isLocal = rootDomain.startsWith("localhost") || rootDomain.endsWith(".localhost") || rootDomain.includes("127.0.0.1");

export const site = {
  name: "myQR",
  legalName: "myQR",
  rootDomain,
  protocol: isLocal ? "http" : "https",
  url: `${isLocal ? "http" : "https"}://${rootDomain}`,
  locale: "en_NZ",
  country: "New Zealand",
  currency: "NZD",
  contactEmail: "hello@myqr.co.nz",

  /** One-off fee to claim a shop address and publish. Placeholder — set your real price. */
  setupFee: 49,
  /**
   * Percentage taken from each sale. It includes card processing: Stripe's fee
   * (NZ cards about 2.65% + 30c) is paid out of this, not by the seller.
   */
  platformFeePercent: 7,
  /** Fixed amount (cents) added to the fee on each sale. */
  platformFeeFixedCents: 0,

  paymentsEnabled: process.env.PAYMENTS_ENABLED === "true",

  tagline: "Your shop, online in an afternoon. Your QR code on the stall by the weekend.",
  description:
    "Set up an online store for your market stall or small shop in New Zealand. Pick your name, list your products, and print a QR code that takes customers straight to your shop. One-off setup fee, no monthly fees.",
} as const;

export function rootUrl(path = "") {
  return `${site.url}${path}`;
}

export function shopUrl(subdomain: string, path = "") {
  return `${site.protocol}://${subdomain}.${site.rootDomain}${path}`;
}

export function shopHost(subdomain: string) {
  return `${subdomain}.${site.rootDomain.split(":")[0]}`;
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}
