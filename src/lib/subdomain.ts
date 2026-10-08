/** Rules for the name a seller claims, e.g. "anna" → anna.myqr.co.nz */

export const SUBDOMAIN_MIN = 3;
export const SUBDOMAIN_MAX = 30;

// Names shorter than SUBDOMAIN_MIN are already blocked, so two-letter words aren't listed.
export const RESERVED_SUBDOMAINS = new Set([
  // Our own pages and features
  "www", "app", "apps", "api", "admin", "administrator", "dashboard", "account", "accounts", "login", "logout",
  "register", "signup", "signin", "sign-in", "sign-up", "join", "start", "create", "new", "get", "claim",
  "auth", "oauth", "sso", "verify", "verification", "confirm", "reset", "password", "recover", "recovery",
  "onboarding", "welcome", "setup", "settings", "profile", "user", "users", "member", "members", "owner",
  "home", "index", "site", "sites", "web", "portal", "hub", "console", "manage", "manager", "panel",
  "control", "cms", "edit", "editor", "print", "studio", "design", "upgrade", "plans", "pricing",
  "blog", "news", "newsletter", "help", "support", "docs", "guide", "guides", "faq", "status", "about",
  "contact", "legal", "terms", "privacy", "policy", "cookies", "careers", "jobs", "press", "partners",
  "affiliate", "affiliates", "ads", "advertising", "marketing", "brand", "community", "forum", "chat",
  // Commerce words a scammer could pass off as ours
  "shop", "shops", "store", "stores", "market", "markets", "marketplace", "sell", "seller", "sellers",
  "buy", "buyer", "order", "orders", "billing", "pay", "payment", "payments", "checkout", "cart", "basket",
  "invoice", "invoices", "receipt", "receipts", "refund", "refunds", "returns", "wallet", "track",
  "tracking", "delivery", "shipping", "gift", "gifts", "giftcard", "voucher", "vouchers", "coupon",
  "coupons", "deals", "offers", "sale", "sales", "catalog", "catalogue", "products", "search", "explore",
  // The platform's own names
  "myqr", "my-qr", "myqrnz", "qrcode", "qrcodes", "qr-code", "official", "team", "staff", "support-team",
  // Infrastructure
  "mail", "email", "webmail", "smtp", "imap", "pop", "pop3", "ftp", "sftp", "dns", "ns1", "ns2", "ns3",
  "ns4", "autodiscover", "autoconfig", "cdn", "static", "assets", "media", "img", "images", "files",
  "uploads", "download", "downloads", "video", "videos", "photos", "public", "private", "secure",
  "security", "abuse", "postmaster", "hostmaster", "webmaster", "root", "system", "internal", "localhost",
  "monitor", "metrics", "analytics", "stats", "health", "ping", "feed", "rss", "git", "cpanel", "whm",
  "test", "testing", "dev", "developer", "developers", "staging", "preview", "demo", "sandbox", "beta",
  "alpha", "temp", "tmp", "backup", "old", "mobile", "wap", "www1", "www2", "example", "null",
  "undefined", "true", "false",
  // Banks, payment providers, government and big NZ brands, to stop look-alike scam shops
  "anz", "asb", "bnz", "westpac", "kiwibank", "tsb", "rabobank", "paypal", "stripe", "afterpay", "laybuy",
  "visa", "mastercard", "amex", "eftpos", "windcave", "poli", "ird", "govt", "gov", "police", "winz",
  "acc", "nzta", "nzpost", "courierpost", "trademe", "google", "apple", "facebook", "instagram", "meta",
  "amazon", "microsoft", "shopify", "vercel", "spark", "onenz", "vodafone", "countdown", "woolworths",
  "paknsave", "newworld", "warehouse", "mitre10", "bunnings",
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
