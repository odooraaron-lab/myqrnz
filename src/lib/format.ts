const nzd = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" });
const nzdWhole = new Intl.NumberFormat("en-NZ", {
  style: "currency",
  currency: "NZD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 1250 → "$12.50", 1200 → "$12" */
export function formatPrice(cents: number) {
  return cents % 100 === 0 ? nzdWhole.format(cents / 100) : nzd.format(cents / 100);
}

/** "$12.50" | "12.5" | "12" → 1250. Returns null for anything that isn't a price. */
export function parsePrice(input: string | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = String(input).replace(/[$,\s]/g, "");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

/** 1250 → "12.50" for form inputs */
export function centsToInput(cents: number | null | undefined) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(/\.00$/, "");
}

export function slugify(input: string, max = 60) {
  return (
    input
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max)
      .replace(/-+$/g, "") || "item"
  );
}

export function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : cut.length)}…`;
}

const dateFmt = new Intl.DateTimeFormat("en-NZ", { day: "numeric", month: "short", year: "numeric", timeZone: "Pacific/Auckland" });
const dateTimeFmt = new Intl.DateTimeFormat("en-NZ", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Pacific/Auckland",
});

export function formatDate(d: Date | string) {
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string) {
  return dateTimeFmt.format(new Date(d));
}

/** Today's date in New Zealand as YYYY-MM-DD. */
export function nzToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(new Date());
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
