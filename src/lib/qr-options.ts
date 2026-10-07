import type { QrStyle } from "./qr";
import { contrastRatio, isHexColor } from "./themes";

/** Settings chosen in the QR studio and carried to the print sheets via the URL. */
export type QrDesign = {
  style: QrStyle;
  fg: string;
  logo: boolean;
  cta: string;
};

export const CTA_PRESETS = [
  "Scan to shop online",
  "Scan to order",
  "Scan to see everything we make",
  "Sold out? Scan to order more",
  "Scan for pickup or delivery",
];

export const COLOUR_PRESETS = [
  { name: "Ink", hex: "#191C3A" },
  { name: "Black", hex: "#000000" },
  { name: "Forest", hex: "#24452F" },
  { name: "Navy", hex: "#0F2A3D" },
  { name: "Plum", hex: "#5B2140" },
  { name: "Rust", hex: "#8A3A1F" },
];

export const TEMPLATES = [
  { id: "sign", name: "A4 stall sign", size: "One per A4 page", use: "Front of the stall or shop window. Readable from a few metres." },
  { id: "tent", name: "A5 table tent", size: "Folds from one A4 page", use: "Stands on the table by your cash box. Shows on both sides." },
  { id: "cards", name: "Counter cards", size: "10 per A4 page, 85 × 55 mm", use: "Business-card size. Hand them out or slip them in bags." },
  { id: "stickers", name: "Small codes", size: "24 per A4 page, 45 mm", use: "For sticker paper, packaging, jars and swing tags." },
  { id: "tags", name: "Product price tags", size: "12 per A4 page", use: "Name, price and a code that opens that product." },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export function parseQrDesign(params: Record<string, string | string[] | undefined>, fallbackFg = "#191C3A"): QrDesign {
  const get = (k: string) => (Array.isArray(params[k]) ? params[k]![0] : params[k]) ?? "";
  const style = (["square", "soft", "dots"] as const).find((s) => s === get("style")) ?? "square";
  const rawFg = get("fg");
  const fg = isHexColor(rawFg) && contrastRatio(rawFg, "#FFFFFF") >= 3 ? rawFg : fallbackFg;
  const cta = get("cta").trim().slice(0, 60) || CTA_PRESETS[0];
  return { style, fg, logo: get("logo") === "1", cta };
}

export function designToQuery(d: QrDesign, extra: Record<string, string> = {}) {
  const q = new URLSearchParams({ style: d.style, fg: d.fg, logo: d.logo ? "1" : "0", cta: d.cta, ...extra });
  return q.toString();
}

/** Below ~4:1 against white, some phone cameras struggle in poor light. */
export function scanWarning(fg: string) {
  const ratio = contrastRatio(fg, "#FFFFFF");
  if (ratio < 3) return "This colour is too light to scan. Choose a darker one.";
  if (ratio < 4.5) return "Lighter colours can be slow to scan in shade. Darker is safer.";
  return null;
}
