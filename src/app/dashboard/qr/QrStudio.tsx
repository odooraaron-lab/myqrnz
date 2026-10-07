"use client";

import { useMemo, useState } from "react";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { qrSvg, qrTarget, type QrStyle } from "@/lib/qr";
import { COLOUR_PRESETS, CTA_PRESETS, designToQuery, scanWarning, TEMPLATES, type QrDesign } from "@/lib/qr-options";

type ShopInfo = { name: string; subdomain: string; host: string; url: string; logoUrl: string | null; accent: string };
type Product = { id: string; title: string; slug: string; price: string };

const STYLES: { id: QrStyle; label: string }[] = [
  { id: "square", label: "Classic" },
  { id: "soft", label: "Soft" },
  { id: "dots", label: "Dots" },
];

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function download(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function QrStudio({ shop, products, initialItem }: { shop: ShopInfo; products: Product[]; initialItem: string }) {
  const [item, setItem] = useState(initialItem);
  const [design, setDesign] = useState<QrDesign>({ style: "square", fg: "#191C3A", logo: false, cta: CTA_PRESETS[0] });
  const [customCta, setCustomCta] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const product = products.find((p) => p.id === item);
  const target = qrTarget(shop.url, product ? `/p/${product.slug}` : "");
  const logo = design.logo && shop.logoUrl ? shop.logoUrl : null;
  const svg = useMemo(() => qrSvg(target, { style: design.style, fg: design.fg, margin: 2, logo }), [target, design.style, design.fg, logo]);
  const warning = scanWarning(design.fg);
  const fileBase = `${shop.subdomain}${product ? `-${product.slug}` : ""}-qr`;
  const set = (patch: Partial<QrDesign>) => setDesign((d) => ({ ...d, ...patch }));

  // Downloads need the logo inlined, otherwise it is missing from the file.
  async function svgForExport() {
    if (!logo) return { svg: qrSvg(target, { style: design.style, fg: design.fg, margin: 4 }), logoDropped: false };
    const data = await toDataUrl(logo);
    return {
      svg: qrSvg(target, { style: design.style, fg: design.fg, margin: 4, logo: data }),
      logoDropped: !data,
    };
  }

  async function downloadSvg() {
    setBusy("svg");
    const { svg: out, logoDropped } = await svgForExport();
    download(URL.createObjectURL(new Blob([out], { type: "image/svg+xml" })), `${fileBase}.svg`);
    setNote(logoDropped ? "Your logo couldn't be added to the file, so it was saved without it." : null);
    setBusy(null);
  }

  async function downloadPng(size: number) {
    setBusy(`png${size}`);
    const { svg: out, logoDropped } = await svgForExport();
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(out)}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = design.style !== "square";
    ctx.drawImage(img, 0, 0, size, size);
    canvas.toBlob((blob) => {
      if (blob) download(URL.createObjectURL(blob), `${fileBase}-${size}.png`);
      setBusy(null);
    }, "image/png");
    setNote(logoDropped ? "Your logo couldn't be added to the file, so it was saved without it." : null);
  }

  const printQuery = (template: string) =>
    designToQuery(design, template === "tags" ? { items: item || "all" } : item ? { item } : {});

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="panel space-y-7 p-6 sm:p-8">
          <div>
            <label htmlFor="qr-target" className="field-label">
              What it opens
            </label>
            <select id="qr-target" className="input" value={item} onChange={(e) => setItem(e.target.value)}>
              <option value="">Your whole shop</option>
              {products.length > 0 && (
                <optgroup label="A single product">
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.price})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="field-hint flex flex-wrap items-center gap-2">
              <span className="break-all">{target.replace(/\?qr$/, "")}</span>
            </p>
          </div>

          <fieldset>
            <legend className="field-label">Style</legend>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <label
                  key={s.id}
                  className={`flex cursor-pointer items-center gap-3 border-[1.5px] px-3 py-2 ${design.style === s.id ? "border-cobalt bg-cobalt-wash/50" : "border-line"}`}
                >
                  <input type="radio" name="style" className="sr-only" checked={design.style === s.id} onChange={() => set({ style: s.id })} />
                  <span
                    aria-hidden="true"
                    className="h-8 w-8 [&>svg]:h-full [&>svg]:w-full"
                    dangerouslySetInnerHTML={{ __html: qrSvg("myqr", { style: s.id, margin: 0, fg: "#191C3A" }) }}
                  />
                  <span className="font-semibold">{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="field-label">Colour</legend>
            <div className="flex flex-wrap items-center gap-2">
              {[...COLOUR_PRESETS, { name: "Your shop colour", hex: shop.accent.toUpperCase() }].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => set({ fg: c.hex })}
                  aria-pressed={design.fg.toUpperCase() === c.hex.toUpperCase()}
                  title={c.name}
                  className={`h-9 w-9 rounded-full border-2 ${design.fg.toUpperCase() === c.hex.toUpperCase() ? "border-cobalt ring-2 ring-cobalt/30" : "border-card"}`}
                  style={{ background: c.hex, boxShadow: "0 0 0 1px var(--color-line)" }}
                >
                  <span className="sr-only">{c.name}</span>
                </button>
              ))}
              <label className="ml-2 flex items-center gap-2 text-sm">
                <input
                  type="color"
                  value={design.fg}
                  onChange={(e) => set({ fg: e.target.value.toUpperCase() })}
                  className="h-9 w-12 cursor-pointer border border-line-strong bg-card p-1"
                />
                Custom
              </label>
            </div>
            {warning && <p className={`mt-2 text-sm ${warning.includes("too light") ? "text-stop" : "text-ink-soft"}`}>{warning}</p>}
          </fieldset>

          {shop.logoUrl ? (
            <label className="flex items-center gap-3 font-medium">
              <input type="checkbox" checked={design.logo} onChange={(e) => set({ logo: e.target.checked })} className="h-4 w-4 accent-cobalt" />
              Put my logo in the middle
            </label>
          ) : (
            <p className="text-sm text-ink-soft">Add a logo in Shop design to put it in the middle of your code.</p>
          )}

          <div>
            <label htmlFor="qr-cta" className="field-label">
              Wording on signs and cards
            </label>
            {customCta ? (
              <input
                id="qr-cta"
                className="input"
                value={design.cta}
                maxLength={60}
                onChange={(e) => set({ cta: e.target.value })}
                placeholder="Scan to shop online"
              />
            ) : (
              <select
                id="qr-cta"
                className="input"
                value={design.cta}
                onChange={(e) => {
                  if (e.target.value === "__custom") {
                    setCustomCta(true);
                    set({ cta: "" });
                  } else set({ cta: e.target.value });
                }}
              >
                {CTA_PRESETS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
                <option value="__custom">Write my own…</option>
              </select>
            )}
            <span className="field-hint">Tell people what scanning does. Codes with a reason to scan get scanned more.</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="panel p-6">
            <div className="mx-auto aspect-square w-full max-w-[18rem] [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            <p className="mt-4 text-center text-sm text-ink-soft">Test it now: point your phone camera at the screen.</p>
          </div>
          <div className="panel space-y-2 p-5">
            <p className="font-bold">Download</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadPng(1024)} disabled={!!busy}>
                {busy === "png1024" ? "Preparing…" : "PNG"}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadPng(3000)} disabled={!!busy}>
                {busy === "png3000" ? "Preparing…" : "PNG, large"}
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={downloadSvg} disabled={!!busy}>
                {busy === "svg" ? "Preparing…" : "SVG"}
              </button>
              <CopyButton value={target.replace(/\?qr$/, "")} label="Copy link" className="btn btn-quiet btn-sm" />
            </div>
            <p className="text-xs text-ink-soft">PNG for Canva, Word and social posts. SVG for printers and signwriters: it stays sharp at any size.</p>
            {note && <p className="text-sm text-stop">{note}</p>}
          </div>
        </div>
      </div>

      <section aria-labelledby="print">
        <h2 id="print" className="font-semiwide text-2xl">
          Print-ready sheets
        </h2>
        <p className="mt-1 text-ink-soft">
          Opens a page sized for A4 paper. Print at 100% (&ldquo;actual size&rdquo;), not &ldquo;fit to page&rdquo;.
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const disabled = t.id === "tags" && products.length === 0;
            return (
              <li key={t.id} className="panel flex flex-col p-5">
                <p className="font-bold">{t.name}</p>
                <p className="text-sm font-medium text-cobalt">{t.size}</p>
                <p className="mt-2 flex-1 text-sm text-ink-soft">
                  {t.use}
                  {t.id === "tags" && (item ? " Printing a tag for the selected product." : " Printing tags for every product for sale.")}
                </p>
                {disabled ? (
                  <p className="mt-4 text-sm text-ink-soft">Add a product first.</p>
                ) : (
                  <a href={`/print/${t.id}?${printQuery(t.id)}`} target="_blank" rel="noopener" className="btn btn-primary btn-sm mt-4 self-start">
                    Open and print
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
