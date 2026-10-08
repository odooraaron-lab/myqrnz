import QRCode from "qrcode";
import { rootUrl } from "@/config/site";
import { DEFAULT_DESIGN, type EyeBall, type EyeFrame, type QrDesign } from "./qr-design";

/**
 * Renders styled QR codes as SVG strings. Runs on the server and in the
 * browser, so previews, downloads and print sheets are drawn the same way.
 * Coordinates are in modules (one QR square = 1 unit).
 */

export type RenderOptions = Partial<QrDesign> & {
  /** Quiet zone in modules. 4 is the standard; frames use 2.5 inside the frame. */
  margin?: number;
  /** Image href for the centre logo, used when `logo` is true. */
  logoHref?: string | null;
  /** Width in pixels for the width/height attributes. */
  size?: number;
  title?: string;
  /** Overlay the preview watermark. */
  watermark?: boolean;
  /** Draw the chosen frame. Print sheets turn this off and supply their own layout. */
  withFrame?: boolean;
  /** Second line on the round badge, e.g. the shop address. */
  subtitle?: string;
  ecl?: "L" | "M" | "Q" | "H";
};

type Matrix = { n: number; dark: (r: number, c: number) => boolean };

const FONT = "Archivo Variable, Archivo, 'Helvetica Neue', Arial, sans-serif";

function makeMatrix(text: string, ecl: NonNullable<RenderOptions["ecl"]>): Matrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: ecl });
  const n = qr.modules.size;
  const data = qr.modules.data;
  return { n, dark: (r, c) => r >= 0 && c >= 0 && r < n && c < n && data[r * n + c] === 1 };
}

const f = (x: number) => +x.toFixed(3);

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Small deterministic random generator, so decorations don't flicker between renders. */
function seeded(seed: string) {
  let x = parseInt(hash(seed), 36) || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

// ── Shape primitives ───────────────────────────────────────────────────────

/** Rectangle with its own radius per corner: [top-left, top-right, bottom-right, bottom-left]. */
function rrect(x: number, y: number, w: number, h: number, radii: number | [number, number, number, number]) {
  const max = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = (typeof radii === "number" ? [radii, radii, radii, radii] : radii).map((r) => Math.max(0, Math.min(r, max)));
  return (
    `M${f(x + tl)},${f(y)}H${f(x + w - tr)}` +
    (tr ? `A${f(tr)},${f(tr)} 0 0 1 ${f(x + w)},${f(y + tr)}` : "") +
    `V${f(y + h - br)}` +
    (br ? `A${f(br)},${f(br)} 0 0 1 ${f(x + w - br)},${f(y + h)}` : "") +
    `H${f(x + bl)}` +
    (bl ? `A${f(bl)},${f(bl)} 0 0 1 ${f(x)},${f(y + h - bl)}` : "") +
    `V${f(y + tl)}` +
    (tl ? `A${f(tl)},${f(tl)} 0 0 1 ${f(x + tl)},${f(y)}` : "") +
    "Z"
  );
}

function circle(cx: number, cy: number, r: number) {
  return `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1 0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1 0 ${f(-2 * r)},0Z`;
}

function diamond(cx: number, cy: number, r: number) {
  return `M${f(cx)},${f(cy - r)}L${f(cx + r)},${f(cy)}L${f(cx)},${f(cy + r)}L${f(cx - r)},${f(cy)}Z`;
}

function bevel(x: number, y: number, w: number, h: number, k: number) {
  return `M${f(x + k)},${f(y)}H${f(x + w - k)}L${f(x + w)},${f(y + k)}V${f(y + h - k)}L${f(x + w - k)},${f(y + h)}H${f(x + k)}L${f(x)},${f(y + h - k)}V${f(y + k)}Z`;
}

type Corner = "tl" | "tr" | "bl";

/** Leaf corners point towards the centre of the code from each finder. */
function leafRadii(corner: Corner, r: number): [number, number, number, number] {
  return corner === "tl" ? [r, 0, r, 0] : [0, r, 0, r];
}

function eyeFramePath(kind: EyeFrame, x: number, y: number, corner: Corner) {
  switch (kind) {
    case "rounded":
      return rrect(x, y, 7, 7, 2.2) + rrect(x + 1, y + 1, 5, 5, 1.4);
    case "circle":
      return circle(x + 3.5, y + 3.5, 3.5) + circle(x + 3.5, y + 3.5, 2.5);
    case "leaf":
      return rrect(x, y, 7, 7, leafRadii(corner, 3)) + rrect(x + 1, y + 1, 5, 5, leafRadii(corner, 2));
    case "cut":
      return bevel(x, y, 7, 7, 1.7) + bevel(x + 1, y + 1, 5, 5, 1.05);
    default:
      return rrect(x, y, 7, 7, 0) + rrect(x + 1, y + 1, 5, 5, 0);
  }
}

function eyeBallPath(kind: EyeBall, x: number, y: number, corner: Corner) {
  const bx = x + 2;
  const by = y + 2;
  switch (kind) {
    case "rounded":
      return rrect(bx, by, 3, 3, 0.9);
    case "circle":
      return circle(bx + 1.5, by + 1.5, 1.5);
    case "leaf":
      return rrect(bx, by, 3, 3, leafRadii(corner, 1.4));
    case "diamond":
      return diamond(bx + 1.5, by + 1.5, 1.8);
    default:
      return rrect(bx, by, 3, 3, 0);
  }
}

// ── Code body ──────────────────────────────────────────────────────────────

function bodyPath(m: Matrix, design: QrDesign, o: number, skip: (r: number, c: number) => boolean) {
  const { n } = m;
  const on = (r: number, c: number) => m.dark(r, c) && !skip(r, c);
  let d = "";

  switch (design.body) {
    case "square":
      for (let r = 0; r < n; r++) {
        let c = 0;
        while (c < n) {
          if (!on(r, c)) {
            c++;
            continue;
          }
          let run = 1;
          while (c + run < n && on(r, c + run)) run++;
          // A hair of overlap stops seams between rows when scaled or rotated.
          d += `M${c + o},${r + o}h${f(run + 0.02)}v1.02h${f(-(run + 0.02))}z`;
          c += run;
        }
      }
      return d;

    case "vbars":
    case "hbars": {
      const vertical = design.body === "vbars";
      for (let a = 0; a < n; a++) {
        let b = 0;
        while (b < n) {
          const isOn = vertical ? on(b, a) : on(a, b);
          if (!isOn) {
            b++;
            continue;
          }
          let run = 1;
          while (b + run < n && (vertical ? on(b + run, a) : on(a, b + run))) run++;
          d += vertical
            ? rrect(a + o + 0.1, b + o + 0.06, 0.8, run - 0.12, 0.4)
            : rrect(b + o + 0.06, a + o + 0.1, run - 0.12, 0.8, 0.4);
          b += run;
        }
      }
      return d;
    }

    default:
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (!on(r, c)) continue;
          const x = c + o;
          const y = r + o;
          switch (design.body) {
            case "rounded":
              d += rrect(x + 0.05, y + 0.05, 0.9, 0.9, 0.32);
              break;
            case "dots":
              d += circle(x + 0.5, y + 0.5, 0.44);
              break;
            case "diamond":
              d += diamond(x + 0.5, y + 0.5, 0.56);
              break;
            case "leaf":
              d += rrect(x + 0.04, y + 0.04, 0.92, 0.92, [0.46, 0.06, 0.46, 0.06]);
              break;
            case "fluid": {
              // Neighbouring modules join up; only free corners are rounded.
              const up = on(r - 1, c);
              const down = on(r + 1, c);
              const left = on(r, c - 1);
              const right = on(r, c + 1);
              d += rrect(x, y, right ? 1.03 : 1, down ? 1.03 : 1, [
                !up && !left ? 0.5 : 0,
                !up && !right ? 0.5 : 0,
                !down && !right ? 0.5 : 0,
                !down && !left ? 0.5 : 0,
              ]);
              break;
            }
          }
        }
      }
      return d;
  }
}

// ── Frame text helpers ─────────────────────────────────────────────────────

function fittedText(text: string, x: number, y: number, size: number, maxWidth: number, fill: string, extra = "") {
  const estimate = text.length * size * 0.56;
  const fit = estimate > maxWidth ? ` textLength="${f(maxWidth)}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text x="${f(x)}" y="${f(y)}" font-family="${FONT}" font-weight="700" font-size="${f(size)}" fill="${fill}" text-anchor="middle" dominant-baseline="central"${fit}${extra}>${esc(text)}</text>`;
}

// ── Main renderer ──────────────────────────────────────────────────────────

export function qrSvg(text: string, opts: RenderOptions = {}): string {
  const design: QrDesign = { ...DEFAULT_DESIGN, frame: "none", ...stripUndefined(opts) };
  const framed = opts.withFrame !== false && design.frame !== "none";
  const logo = design.logo && opts.logoHref ? opts.logoHref : null;
  const ecl = opts.ecl ?? (logo ? "H" : opts.watermark ? "Q" : "M");
  const m = makeMatrix(text, ecl);
  const n = m.n;
  const margin = opts.margin ?? (framed ? (design.frame === "round" ? 3 : 2.5) : 4);
  const Q = n + margin * 2; // code box, including quiet zone

  // Space left clear in the middle for a logo (odd number of modules, ~22%).
  let hole: { from: number; to: number } | null = null;
  if (logo) {
    let span = Math.round(n * 0.22);
    if (span % 2 === 0) span += 1;
    const from = Math.floor((n - span) / 2);
    hole = { from, to: from + span };
  }
  const inFinder = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const inHole = (r: number, c: number) => !!hole && r >= hole.from - 1 && r < hole.to + 1 && c >= hole.from - 1 && c < hole.to + 1;

  // Paint for modules: solid or gradient.
  const gid = `g${hash(`${design.fg}${design.fg2}${design.gradient}${n}${margin}`)}`;
  let defs = "";
  let paint = design.fg;
  if (design.fg2) {
    paint = `url(#${gid})`;
    defs +=
      design.gradient === "radial"
        ? `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${f(Q / 2)}" cy="${f(Q / 2)}" r="${f(n * 0.72)}"><stop offset="0" stop-color="${design.fg2}"/><stop offset="1" stop-color="${design.fg}"/></radialGradient>`
        : `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(margin)}" y1="${f(margin)}" x2="${f(margin + n)}" y2="${f(margin + n)}"><stop offset="0" stop-color="${design.fg}"/><stop offset="1" stop-color="${design.fg2}"/></linearGradient>`;
  }
  const eyePaint = design.eyeColor ?? paint;

  // The code itself, drawn in a Q×Q box.
  let code = `<path d="${bodyPath(m, design, margin, (r, c) => inFinder(r, c) || inHole(r, c))}" fill="${paint}"/>`;
  let frames = "";
  let balls = "";
  for (const [corner, fr, fc] of [
    ["tl", 0, 0],
    ["tr", 0, n - 7],
    ["bl", n - 7, 0],
  ] as [Corner, number, number][]) {
    frames += eyeFramePath(design.eyeFrame, fc + margin, fr + margin, corner);
    balls += eyeBallPath(design.eyeBall, fc + margin, fr + margin, corner);
  }
  code += `<path d="${frames}" fill="${eyePaint}" fill-rule="evenodd"/><path d="${balls}" fill="${eyePaint}"/>`;
  if (hole && logo) {
    const span = hole.to - hole.from;
    const x = hole.from + margin;
    const pad = 0.45;
    code +=
      `<rect x="${f(x - pad)}" y="${f(x - pad)}" width="${f(span + pad * 2)}" height="${f(span + pad * 2)}" rx="${design.body === "square" ? 0 : 1}" fill="${design.bg}"/>` +
      `<image href="${esc(logo)}" x="${x}" y="${x}" width="${span}" height="${span}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  // Frame layout. Everything below works out the canvas size and where the code box sits.
  const fc = design.frameColor ?? design.fg;
  const t = Math.max(0.9, Q * 0.028); // frame line thickness
  const rad = Q * 0.07;
  const L = Q * 0.21; // label band height
  const label = design.cta;
  let W = Q;
  let H = Q;
  let ox = 0;
  let oy = 0;
  let back = "";
  let front = "";

  if (!framed) {
    back = `<rect width="${f(Q)}" height="${f(Q)}" fill="${design.bg}"/>`;
  } else if (design.frame === "banner") {
    W = Q + 2 * t;
    H = Q + t + L;
    ox = t;
    oy = t;
    back = `<path d="${rrect(0, 0, W, H, rad)}" fill="${fc}"/><path d="${rrect(t, t, Q, Q, [rad * 0.7, rad * 0.7, 0, 0])}" fill="${design.bg}"/>`;
    front = fittedText(label, W / 2, Q + t + L / 2, L * 0.44, W * 0.86, design.bg);
  } else if (design.frame === "tab") {
    W = Q + 2 * t;
    H = L + Q + t;
    ox = t;
    oy = L;
    back = `<path d="${rrect(0, 0, W, H, rad)}" fill="${fc}"/><path d="${rrect(t, L, Q, Q, [0, 0, rad * 0.7, rad * 0.7])}" fill="${design.bg}"/>`;
    front = fittedText(label, W / 2, L / 2 + t * 0.2, L * 0.44, W * 0.86, design.bg);
  } else if (design.frame === "outline") {
    W = Q + 2 * t;
    H = Q + 2 * t + L;
    ox = t;
    oy = t;
    back =
      `<rect width="${f(W)}" height="${f(H)}" fill="${design.bg}"/>` +
      `<path d="${rrect(0, 0, W, Q + 2 * t, rad)}${rrect(t, t, Q, Q, rad * 0.6)}" fill="${fc}" fill-rule="evenodd"/>`;
    front = fittedText(label, W / 2, Q + 2 * t + L * 0.55, L * 0.46, W * 0.92, fc);
  } else if (design.frame === "bubble") {
    const gap = Q * 0.09;
    const p = Q * 0.055;
    W = Q + 2 * t;
    H = Q + 2 * t + gap + L;
    ox = t;
    oy = t;
    const by = Q + 2 * t + gap;
    back =
      `<rect width="${f(W)}" height="${f(H)}" fill="${design.bg}"/>` +
      `<path d="${rrect(0, 0, W, Q + 2 * t, rad)}${rrect(t, t, Q, Q, rad * 0.6)}" fill="${fc}" fill-rule="evenodd"/>` +
      `<path d="${rrect(0, by, W, L, L / 2)}M${f(W / 2 - p)},${f(by + 0.1)}L${f(W / 2)},${f(by - p)}L${f(W / 2 + p)},${f(by + 0.1)}Z" fill="${fc}"/>`;
    front = fittedText(label, W / 2, by + L / 2, L * 0.42, W * 0.82, design.bg);
  } else if (design.frame === "round") {
    const band = Q * 0.13;
    const inner = (Q / 2) * Math.SQRT2 + 0.6; // circle that clears the corners of the code box
    const R = inner + band;
    W = H = 2 * R;
    ox = oy = R - Q / 2;
    const cx = R;
    const cy = R;
    // Decorative modules between the code and the ring, matching the body style.
    const rand = seeded(text + design.body);
    const deco: string[] = [];
    const span = Math.ceil(inner);
    for (let r = -span; r < Q + span; r++) {
      for (let c = -span; c < Q + span; c++) {
        if (r >= 0 && r < Q && c >= 0 && c < Q) continue; // the code box keeps its quiet zone
        const mx = ox + c + 0.5;
        const my = oy + r + 0.5;
        if (Math.hypot(mx - cx, my - cy) > inner - 0.75) continue;
        if (rand() < 0.42) deco.push(design.body === "square" || design.body === "vbars" || design.body === "hbars" ? rrect(mx - 0.45, my - 0.45, 0.9, 0.9, 0.12) : design.body === "diamond" ? diamond(mx, my, 0.5) : circle(mx, my, 0.4));
      }
    }
    const rt = R - band / 2;
    const tid = `t${hash(`${R}${rt}${gid}`)}`;
    defs +=
      `<path id="${tid}a" d="M${f(cx - rt)},${f(cy)}A${f(rt)},${f(rt)} 0 0 1 ${f(cx + rt)},${f(cy)}"/>` +
      `<path id="${tid}b" d="M${f(cx - rt)},${f(cy)}A${f(rt)},${f(rt)} 0 0 0 ${f(cx + rt)},${f(cy)}"/>`;
    const fs = band * 0.46;
    const arcText = (id: string, words: string) =>
      `<text font-family="${FONT}" font-weight="700" font-size="${f(fs)}" letter-spacing="${f(fs * 0.08)}" fill="${design.bg}" dominant-baseline="central"><textPath href="#${id}" startOffset="50%" text-anchor="middle">${esc(words)}</textPath></text>`;
    back =
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R)}" fill="${fc}"/>` +
      `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(inner)}" fill="${design.bg}"/>` +
      (deco.length ? `<path d="${deco.join("")}" fill="${design.fg}" fill-opacity="0.3"/>` : "");
    front = arcText(`${tid}a`, label.toUpperCase()) + (opts.subtitle ? arcText(`${tid}b`, opts.subtitle) : "");
  }

  const watermark = opts.watermark ? watermarkLayer(W, H, ox, oy, Q) : "";
  const px = opts.size ? ` width="${opts.size}" height="${f((opts.size * H) / W)}"` : "";
  const title = opts.title ? `<title>${esc(opts.title)}</title>` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${f(W)} ${f(H)}"${px} role="img">` +
    title +
    (defs ? `<defs>${defs}</defs>` : "") +
    back +
    `<g transform="translate(${f(ox)} ${f(oy)})">${code}</g>` +
    front +
    watermark +
    `</svg>`
  );
}

/**
 * Preview watermark: a faint repeated "myQR preview" texture over the whole
 * image, and a solid "PREVIEW" band across the middle of the code. The band
 * stays clear of the three corner squares so the preview still scans (to the
 * myQR preview page), letting sellers test a design on their phone.
 */
function watermarkLayer(W: number, H: number, bx: number, by: number, Q: number) {
  const s = Math.max(W, H);
  const small = s * 0.03;
  const line = Array(10).fill("myQR preview").join("     ");
  let faint = "";
  for (let k = -3; k <= 3; k++) {
    faint += `<text x="${f(W / 2)}" y="${f(H / 2 + k * s * 0.16)}" font-family="${FONT}" font-weight="700" font-size="${f(small)}" text-anchor="middle" dominant-baseline="central" fill="#191C3A" fill-opacity="0.16">${line}</text>`;
  }
  const cx = bx + Q / 2;
  const cy = by + Q / 2;
  const bw = Q * 0.66;
  const bh = Q * 0.14;
  return (
    `<g pointer-events="none">` +
    `<g transform="rotate(-30 ${f(W / 2)} ${f(H / 2)})">${faint}</g>` +
    `<g transform="rotate(-12 ${f(cx)} ${f(cy)})">` +
    `<rect x="${f(cx - bw / 2)}" y="${f(cy - bh / 2)}" width="${f(bw)}" height="${f(bh)}" rx="${f(bh * 0.18)}" fill="#FFFFFF" fill-opacity="0.92" stroke="#191C3A" stroke-width="${f(bh * 0.06)}"/>` +
    `<text x="${f(cx)}" y="${f(cy)}" font-family="${FONT}" font-weight="800" font-size="${f(bh * 0.52)}" letter-spacing="${f(bh * 0.12)}" text-anchor="middle" dominant-baseline="central" fill="#191C3A">PREVIEW</text>` +
    `</g></g>`
  );
}

function stripUndefined<T extends object>(o: T): Partial<T> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** One finder pattern on its own, for the corner-style pickers. */
export function eyeSwatchSvg(frame: EyeFrame, ball: EyeBall, color = "#191C3A") {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.75 -0.75 8.5 8.5" role="img">` +
    `<path d="${eyeFramePath(frame, 0, 0, "tl")}" fill="${color}" fill-rule="evenodd"/>` +
    `<path d="${eyeBallPath(ball, 0, 0, "tl")}" fill="${color}"/></svg>`
  );
}

/** The URL encoded in a shop's real QR code. `?qr` lets the shop count scans. */
export function qrTarget(shopUrl: string, path = "") {
  return `${shopUrl}${path || "/"}?qr`;
}

/** The URL encoded in preview codes: a myQR page, never the shop itself. */
export function previewTarget(subdomain?: string, slug?: string) {
  const q = new URLSearchParams();
  if (subdomain) q.set("s", subdomain);
  if (slug) q.set("p", slug);
  const qs = q.toString();
  return rootUrl(`/preview${qs ? `?${qs}` : ""}`);
}

/** Sample content used for style swatches, so pickers never show a real code. */
export const SAMPLE_TEXT = "https://myqr.co.nz/sample";
