/** Rules for the name a seller claims, e.g. "anna" → anna.myqr.co.nz */

export const SUBDOMAIN_MIN = 3;
export const SUBDOMAIN_MAX = 30;

export const RESERVED_SUBDOMAINS = new Set([
  "www", "app", "api", "admin", "administrator", "dashboard", "account", "accounts", "login", "logout",
  "register", "signup", "signin", "auth", "oauth", "sso", "mail", "email", "smtp", "imap", "pop", "mx",
  "ftp", "ns", "ns1", "ns2", "dns", "cdn", "static", "assets", "media", "img", "images", "files", "uploads",
  "blog", "news", "help", "support", "docs", "guide", "guides", "faq", "status", "about", "contact",
  "legal", "terms", "privacy", "billing", "pay", "payment", "payments", "checkout", "cart", "invoice",
  "shop", "shops", "store", "stores", "market", "markets", "sell", "seller", "sellers", "buy", "orders",
  "myqr", "my-qr", "qr", "qrcode", "official", "team", "staff", "security", "abuse", "postmaster",
  "hostmaster", "webmaster", "root", "system", "test", "testing", "dev", "staging", "preview", "demo",
  "beta", "alpha", "internal", "localhost", "example", "null", "undefined", "s",
  // Used by other projects on this domain. Vercel sends these hosts to those
  // projects, so a shop with one of these names would be unreachable.
  "digitalsignage", "resthome", "reviews",
]);

/** Turns free text ("Anna's Jams & Preserves") into a candidate name ("annas-jams-preserves"). */
export function suggestSubdomain(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SUBDOMAIN_MAX)
    .replace(/-+$/g, "");
}

/** Returns an error message, or null when the name is acceptable. */
export function subdomainProblem(name: string): string | null {
  if (!name) return "Choose a name for your shop address.";
  if (name.length < SUBDOMAIN_MIN) return `Use at least ${SUBDOMAIN_MIN} characters.`;
  if (name.length > SUBDOMAIN_MAX) return `Use ${SUBDOMAIN_MAX} characters or fewer.`;
  if (!/^[a-z0-9-]+$/.test(name)) return "Use lowercase letters, numbers and hyphens only.";
  if (name.startsWith("-") || name.endsWith("-")) return "Start and end with a letter or number.";
  if (name.includes("--")) return "Use single hyphens between words.";
  if (RESERVED_SUBDOMAINS.has(name)) return "That name is reserved. Try another.";
  return null;
}
