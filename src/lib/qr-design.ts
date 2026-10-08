import { contrastRatio, getTheme, isHexColor } from "./themes";

/**
 * Everything a seller can choose about how their QR code looks. Stored on the
 * shop (shops.qr_design) so the studio, print sheets and dashboard all match.
 */

export const BODY_SHAPES = [
  { id: "square", label: "Classic" },
  { id: "rounded", label: "Rounded" },
  { id: "fluid", label: "Fluid" },
  { id: "dots", label: "Dots" },
  { id: "diamond", label: "Diamonds" },
  { id: "leaf", label: "Leaf" },
  { id: "vbars", label: "Columns" },
  { id: "hbars", label: "Rows" },
] as const;

export const EYE_FRAMES = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "leaf", label: "Leaf" },
  { id: "cut", label: "Bevel" },
] as const;

export const EYE_BALLS = [
  { id: "square", label: "Square" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
  { id: "leaf", label: "Leaf" },
  { id: "diamond", label: "Diamond" },
] as const;

export const FRAMES = [
  { id: "none", label: "No frame" },
  { id: "banner", label: "Banner" },
  { id: "tab", label: "Tab" },
  { id: "outline", label: "Outline" },
  { id: "bubble", label: "Speech" },
  { id: "round", label: "Round badge" },
] as const;

export type BodyShape = (typeof BODY_SHAPES)[number]["id"];
export type EyeFrame = (typeof EYE_FRAMES)[number]["id"];
export type EyeBall = (typeof EYE_BALLS)[number]["id"];
export type FrameStyle = (typeof FRAMES)[number]["id"];
export type GradientType = "linear" | "radial";

export type QrDesign = {
  body: BodyShape;
  eyeFrame: EyeFrame;
  eyeBall: EyeBall;
  /** Main colour, or gradient start. */
  fg: string;
  /** Gradient end. Null for a solid colour. */
  fg2: string | null;
  gradient: GradientType;
  /** Corner (finder) colour. Null to match the code. */
  eyeColor: string | null;
  /** Always a light colour: dark-on-light codes scan on every phone. */
  bg: string;
  frame: FrameStyle;
  /** Frame colour. Null to match the code. */
  frameColor: string | null;
  /** Words on the frame and on print sheets. */
  cta: string;
  logo: boolean;
};

export const CTA_MAX = 40;

export const CTA_PRESETS = [
  "Scan to shop online",
  "Scan to order",
  "Scan me",
  "Shop the full range",
  "Sold out? Scan to order",
  "Scan for pickup or delivery",
];

export const DEFAULT_DESIGN: QrDesign = {
  body: "rounded",
  eyeFrame: "rounded",
  eyeBall: "rounded",
  fg: "#191C3A",
  fg2: null,
  gradient: "linear",
  eyeColor: null,
  bg: "#FFFFFF",
  frame: "banner",
  frameColor: null,
  cta: CTA_PRESETS[0],
  logo: false,
};

export const INK_PRESETS = [
  { name: "Ink", hex: "#191C3A" },
  { name: "Black", hex: "#111111" },
  { name: "Cobalt", hex: "#1A33B8" },
  { name: "Navy", hex: "#0F2A3D" },
  { name: "Teal", hex: "#0B5E68" },
  { name: "Forest", hex: "#24452F" },
  { name: "Olive", hex: "#4A5A1E" },
  { name: "Plum", hex: "#5B2140" },
  { name: "Wine", hex: "#7A1F2B" },
  { name: "Rust", hex: "#8A3A1F" },
  { name: "Cocoa", hex: "#3A2219" },
  { name: "Slate", hex: "#3A4250" },
];

export const PAPER_PRESETS = [
  { name: "White", hex: "#FFFFFF" },
  { name: "Paper", hex: "#F7F5EF" },
  { name: "Sand", hex: "#F6EFE4" },
  { name: "Blush", hex: "#FBF0EF" },
  { name: "Mint", hex: "#EDF6F0" },
  { name: "Sky", hex: "#EDF3FA" },
  { name: "Butter", hex: "#FBF6DF" },
];

/** Curated combinations — one tap to a finished look. */
export const LOOKS: { id: string; name: string; design: Partial<QrDesign> }[] = [
  {
    id: "classic",
    name: "Classic",
    design: { body: "square", eyeFrame: "square", eyeBall: "square", fg: "#111111", fg2: null, eyeColor: null, bg: "#FFFFFF", frame: "none" },
  },
  {
    id: "market",
    name: "Market",
    design: { body: "rounded", eyeFrame: "rounded", eyeBall: "rounded", fg: "#191C3A", fg2: null, eyeColor: null, bg: "#FFFFFF", frame: "banner" },
  },
  {
    id: "fluid",
    name: "Fluid",
    design: { body: "fluid", eyeFrame: "leaf", eyeBall: "leaf", fg: "#1A33B8", fg2: "#0B5E68", gradient: "linear", eyeColor: null, bg: "#FFFFFF", frame: "bubble" },
  },
  {
    id: "harvest",
    name: "Harvest",
    design: { body: "dots", eyeFrame: "circle", eyeBall: "circle", fg: "#24452F", fg2: "#4A5A1E", gradient: "radial", eyeColor: null, bg: "#EDF6F0", frame: "tab" },
  },
  {
    id: "boutique",
    name: "Boutique",
    design: { body: "leaf", eyeFrame: "leaf", eyeBall: "leaf", fg: "#5B2140", fg2: null, eyeColor: null, bg: "#FBF0EF", frame: "outline" },
  },
  {
    id: "coast",
    name: "Coast",
    design: { body: "vbars", eyeFrame: "rounded", eyeBall: "circle", fg: "#0F2A3D", fg2: "#1A5F96", gradient: "linear", eyeColor: null, bg: "#EDF3FA", frame: "round" },
  },
  {
    id: "clay",
    name: "Clay",
    design: { body: "fluid", eyeFrame: "circle", eyeBall: "circle", fg: "#8A3A1F", fg2: null, eyeColor: "#3A2219", bg: "#F6EFE4", frame: "banner" },
  },
  {
    id: "signal",
    name: "Signal",
    design: { body: "diamond", eyeFrame: "cut", eyeBall: "diamond", fg: "#191C3A", fg2: null, eyeColor: "#B42318", bg: "#FFFFFF", frame: "tab" },
  },
  {
    id: "type",
    name: "Typeset",
    design: { body: "hbars", eyeFrame: "square", eyeBall: "rounded", fg: "#3A4250", fg2: "#111111", gradient: "linear", eyeColor: null, bg: "#F7F5EF", frame: "outline" },
  },
];

// ── Validation ──────────────────────────────────────────────────────────────

const MIN_INK_CONTRAST = 4;

function isLight(hex: string) {
  return contrastRatio(hex, "#000000") >= 13;
}

/** True when this colour will scan reliably on the background. */
export function inkWorks(ink: string, bg: string) {
  return isHexColor(ink) && contrastRatio(ink, bg) >= MIN_INK_CONTRAST;
}

function pick<T extends string>(value: unknown, allowed: readonly { id: T }[], fallback: T): T {
  return allowed.some((a) => a.id === value) ? (value as T) : fallback;
}

/** Turns anything (form data, stored JSON, URL params) into a design that will scan. */
export function sanitizeDesign(input: unknown, fallback: QrDesign = DEFAULT_DESIGN): QrDesign {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const hex = (v: unknown) => (typeof v === "string" && isHexColor(v) ? v.toUpperCase() : null);

  const bg = hex(raw.bg) && isLight(hex(raw.bg)!) ? hex(raw.bg)! : fallback.bg;
  const ink = (v: unknown) => {
    const h = hex(v);
    return h && inkWorks(h, bg) ? h : null;
  };
  const fg = ink(raw.fg) ?? (inkWorks(fallback.fg, bg) ? fallback.fg : DEFAULT_DESIGN.fg);
  const frameColor = hex(raw.frameColor);

  const cta =
    typeof raw.cta === "string"
      ? raw.cta.replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, CTA_MAX)
      : "";

  return {
    body: pick(raw.body, BODY_SHAPES, fallback.body),
    eyeFrame: pick(raw.eyeFrame, EYE_FRAMES, fallback.eyeFrame),
    eyeBall: pick(raw.eyeBall, EYE_BALLS, fallback.eyeBall),
    fg,
    fg2: raw.fg2 === null ? null : ink(raw.fg2),
    gradient: raw.gradient === "radial" ? "radial" : "linear",
    eyeColor: raw.eyeColor === null ? null : ink(raw.eyeColor),
    bg,
    frame: pick(raw.frame, FRAMES, fallback.frame),
    // Frame words are drawn in the background colour, so the frame needs contrast with it.
    frameColor: frameColor && contrastRatio(frameColor, bg) >= 3 ? frameColor : null,
    cta: cta || fallback.cta || CTA_PRESETS[0],
    logo: raw.logo === true,
  };
}

/** Problems to show beside the colour pickers, without changing anything. */
export function colourProblem(ink: string, bg: string): string | null {
  if (!isHexColor(ink)) return null;
  const ratio = contrastRatio(ink, bg);
  if (ratio < MIN_INK_CONTRAST) return "Too light to scan reliably on this background. Pick a darker colour.";
  if (ratio < 5.5) return "Scans fine, but darker is safer in shade or dim light.";
  return null;
}

/** The design a shop uses: what they saved, or a starting point in their shop colour. */
export function designForShop(saved: unknown, accent?: string | null): QrDesign {
  if (saved && typeof saved === "object") return sanitizeDesign(saved);
  const start = { ...DEFAULT_DESIGN };
  if (accent && inkWorks(accent, "#FFFFFF") && contrastRatio(accent, "#FFFFFF") >= 5.5) start.fg = accent.toUpperCase();
  return start;
}

/** Resolves the design for a shop record, falling back to its theme colour. */
export function shopDesign(shop: { qrDesign: unknown; accentColor: string | null; theme: string }) {
  const accent = isHexColor(shop.accentColor) ? shop.accentColor : getTheme(shop.theme).colors.accent;
  return designForShop(shop.qrDesign, accent);
}

/** Look used for marketing previews (hero, sign-up). */
export const SHOWCASE_DESIGN: QrDesign = {
  ...DEFAULT_DESIGN,
  body: "fluid",
  eyeFrame: "rounded",
  eyeBall: "circle",
  fg: "#191C3A",
  fg2: "#2546F0",
  gradient: "linear",
  frame: "none",
};
