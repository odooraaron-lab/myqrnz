/** Storefront themes sellers can choose from. Each is a palette plus a type pairing. */

export type FontKey = "archivo" | "archivo-wide" | "newsreader" | "bodoni" | "manrope";

export const FONT_STACKS: Record<FontKey, { family: string; stretch?: string }> = {
  archivo: { family: "'Archivo Variable', system-ui, sans-serif" },
  "archivo-wide": { family: "'Archivo Variable', system-ui, sans-serif", stretch: "118%" },
  newsreader: { family: "'Newsreader Variable', Georgia, serif" },
  bodoni: { family: "'Bodoni Moda Variable', Didot, Georgia, serif" },
  manrope: { family: "'Manrope Variable', system-ui, sans-serif" },
};

export type Theme = {
  id: ThemeId;
  name: string;
  suits: string;
  colors: {
    bg: string;
    surface: string;
    text: string;
    muted: string;
    line: string;
    accent: string;
  };
  heading: FontKey;
  body: FontKey;
  headingWeight: number;
  radius: string;
};

export const THEME_IDS = ["paper", "harvest", "gallery", "boutique", "coast", "night", "clay"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const THEMES: Record<ThemeId, Theme> = {
  paper: {
    id: "paper",
    name: "Paper",
    suits: "Clean and bright. Works for almost anything.",
    colors: { bg: "#FAFAF7", surface: "#FFFFFF", text: "#1A1D2E", muted: "#5D6275", line: "#E2E1DA", accent: "#2546F0" },
    heading: "archivo-wide",
    body: "archivo",
    headingWeight: 700,
    radius: "4px",
  },
  harvest: {
    id: "harvest",
    name: "Harvest",
    suits: "Produce, plants, preserves and farm gate stalls.",
    colors: { bg: "#F0F2E8", surface: "#FBFCF7", text: "#1F2A1C", muted: "#56604F", line: "#D6DBC9", accent: "#2F6B3A" },
    heading: "archivo-wide",
    body: "archivo",
    headingWeight: 800,
    radius: "2px",
  },
  gallery: {
    id: "gallery",
    name: "Gallery",
    suits: "Art, prints and photography. Lets the work speak.",
    colors: { bg: "#FFFFFF", surface: "#FFFFFF", text: "#151515", muted: "#6A6A6A", line: "#E6E6E6", accent: "#151515" },
    heading: "newsreader",
    body: "manrope",
    headingWeight: 400,
    radius: "0px",
  },
  boutique: {
    id: "boutique",
    name: "Boutique",
    suits: "Jewellery, clothing, beauty and gifts.",
    colors: { bg: "#F6F1EF", surface: "#FFFFFF", text: "#2B1E22", muted: "#76656A", line: "#E6DAD6", accent: "#7A2E46" },
    heading: "bodoni",
    body: "manrope",
    headingWeight: 500,
    radius: "0px",
  },
  coast: {
    id: "coast",
    name: "Coast",
    suits: "Surf, outdoors, crafts and anything by the sea.",
    colors: { bg: "#EDF3F6", surface: "#FFFFFF", text: "#0F2A3D", muted: "#4C6576", line: "#D2E0E8", accent: "#1F6FA8" },
    heading: "manrope",
    body: "manrope",
    headingWeight: 800,
    radius: "10px",
  },
  night: {
    id: "night",
    name: "Night market",
    suits: "Food stalls, coffee carts and late markets.",
    colors: { bg: "#131518", surface: "#1C1F24", text: "#F1EFE9", muted: "#A5A9B2", line: "#2D3139", accent: "#F2C14E" },
    heading: "archivo-wide",
    body: "manrope",
    headingWeight: 800,
    radius: "6px",
  },
  clay: {
    id: "clay",
    name: "Clay",
    suits: "Ceramics, homewares, candles and handmade goods.",
    colors: { bg: "#F5EDE6", surface: "#FFFAF6", text: "#3A2219", muted: "#7B6158", line: "#E4D3C8", accent: "#A9502E" },
    heading: "newsreader",
    body: "manrope",
    headingWeight: 500,
    radius: "14px",
  },
};

export function getTheme(id: string | null | undefined): Theme {
  return THEMES[(id as ThemeId) ?? "paper"] ?? THEMES.paper;
}

export function isHexColor(value: string | null | undefined): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value);
}

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Black or white, whichever reads better on the given colour. */
export function readableOn(hex: string) {
  return contrastRatio(hex, "#FFFFFF") >= contrastRatio(hex, "#111111") ? "#FFFFFF" : "#111111";
}

/** CSS custom properties for a shop, combining its theme and optional accent colour. */
export function themeStyle(themeId: string | null | undefined, accentColor?: string | null): Record<string, string> {
  const t = getTheme(themeId);
  const accent = isHexColor(accentColor) ? accentColor : t.colors.accent;
  const heading = FONT_STACKS[t.heading];
  const body = FONT_STACKS[t.body];
  return {
    "--s-bg": t.colors.bg,
    "--s-surface": t.colors.surface,
    "--s-text": t.colors.text,
    "--s-muted": t.colors.muted,
    "--s-line": t.colors.line,
    "--s-accent": accent,
    "--s-on-accent": readableOn(accent),
    "--s-heading": heading.family,
    "--s-heading-stretch": heading.stretch ?? "100%",
    "--s-heading-weight": String(t.headingWeight),
    "--s-body": body.family,
    "--s-radius": t.radius,
  };
}
