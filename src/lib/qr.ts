import QRCode from "qrcode";

/**
 * Renders a QR code as an SVG string. Works on the server and in the browser,
 * so the same drawing is used for previews, downloads and print sheets.
 */

export type QrStyle = "square" | "soft" | "dots";

export type QrOptions = {
  style?: QrStyle;
  fg?: string;
  bg?: string;
  /** Quiet zone in modules. 4 is the standard; 2 is fine when printed on a light card. */
  margin?: number;
  /** URL or data URL of a logo placed in the centre. Raises error correction to H. */
  logo?: string | null;
  /** Rendered pixel size for width/height attributes; viewBox stays in modules. */
  size?: number;
  title?: string;
};

type Matrix = { size: number; dark: (r: number, c: number) => boolean };

export function qrMatrix(text: string, logo = false): Matrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: logo ? "H" : "M" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  return { size, dark: (r, c) => data[r * size + c] === 1 };
}

function inFinder(r: number, c: number, size: number) {
  return (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
}

function roundedRect(x: number, y: number, w: number, h: number, rad: number) {
  const r = Math.min(rad, w / 2, h / 2);
  if (r <= 0) return `M${x},${y}h${w}v${h}h${-w}z`;
  return (
    `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}` +
    `h${-(w - 2 * r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h - 2 * r)}a${r},${r} 0 0 1 ${r},${-r}z`
  );
}

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

export function qrSvg(text: string, opts: QrOptions = {}): string {
  const style = opts.style ?? "square";
  const fg = opts.fg ?? "#000000";
  const bg = opts.bg ?? "#FFFFFF";
  const margin = opts.margin ?? 4;
  const { size, dark } = qrMatrix(text, !!opts.logo);
  const total = size + margin * 2;

  // Area cleared for a centre logo (odd number of modules, ~22% of the code).
  let hole: { from: number; to: number } | null = null;
  if (opts.logo) {
    let span = Math.round(size * 0.22);
    if (span % 2 === 0) span += 1;
    const from = Math.floor((size - span) / 2);
    hole = { from, to: from + span };
  }
  const inHole = (r: number, c: number) => !!hole && r >= hole.from - 1 && r < hole.to + 1 && c >= hole.from - 1 && c < hole.to + 1;

  let body = "";
  const o = margin;

  if (style === "square") {
    // Merge horizontal runs to keep the SVG small.
    for (let r = 0; r < size; r++) {
      let c = 0;
      while (c < size) {
        if (dark(r, c) && !inFinder(r, c, size) && !inHole(r, c)) {
          let run = 1;
          while (c + run < size && dark(r, c + run) && !inFinder(r, c + run, size) && !inHole(r, c + run)) run++;
          body += `M${c + o},${r + o}h${run}v1h${-run}z`;
          c += run;
        } else c++;
      }
    }
  } else {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!dark(r, c) || inFinder(r, c, size) || inHole(r, c)) continue;
        if (style === "dots") {
          const cx = c + o + 0.5;
          const cy = r + o + 0.5;
          body += `M${cx - 0.45},${cy}a0.45,0.45 0 1 0 0.9,0a0.45,0.45 0 1 0 -0.9,0z`;
        } else {
          body += roundedRect(c + o + 0.06, r + o + 0.06, 0.88, 0.88, 0.3);
        }
      }
    }
  }

  // Finder patterns: drawn as whole shapes so they stay crisp in every style.
  const ring = style === "square" ? 0 : style === "soft" ? 1.6 : 2.2;
  const eye = style === "square" ? 0 : style === "soft" ? 0.8 : 1.5;
  let finders = "";
  for (const [fr, fc] of [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ]) {
    const x = fc + o;
    const y = fr + o;
    finders += roundedRect(x, y, 7, 7, ring) + roundedRect(x + 1, y + 1, 5, 5, Math.max(ring - 1, 0));
    finders += roundedRect(x + 2, y + 2, 3, 3, eye);
  }

  let logoSvg = "";
  if (hole && opts.logo) {
    const span = hole.to - hole.from;
    const x = hole.from + o;
    const pad = 0.4;
    logoSvg =
      `<rect x="${x - pad}" y="${x - pad}" width="${span + pad * 2}" height="${span + pad * 2}" rx="${style === "square" ? 0 : 1}" fill="${bg}"/>` +
      `<image href="${escapeAttr(opts.logo)}" x="${x}" y="${x}" width="${span}" height="${span}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  const px = opts.size ? ` width="${opts.size}" height="${opts.size}"` : "";
  const title = opts.title ? `<title>${escapeAttr(opts.title)}</title>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${px} shape-rendering="${style === "square" ? "crispEdges" : "geometricPrecision"}" role="img">` +
    title +
    `<rect width="${total}" height="${total}" fill="${bg}"/>` +
    `<path d="${body}" fill="${fg}"/>` +
    `<path d="${finders}" fill="${fg}" fill-rule="evenodd"/>` +
    logoSvg +
    `</svg>`
  );
}

/** The URL encoded in a shop's QR code. `?qr` lets the shop count scans. */
export function qrTarget(shopUrl: string, path = "") {
  return `${shopUrl}${path || "/"}?qr`;
}
