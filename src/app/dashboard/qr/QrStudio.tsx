"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { CopyButton } from "@/components/dashboard/CopyButton";
import { StallSign } from "@/components/marketing/StallSign";
import { TEMPLATES } from "@/lib/print-templates";
import { eyeSwatchSvg, qrSvg, SAMPLE_TEXT } from "@/lib/qr";
import {
  BODY_SHAPES,
  colourProblem,
  CTA_MAX,
  CTA_PRESETS,
  EYE_BALLS,
  EYE_FRAMES,
  FRAMES,
  INK_PRESETS,
  inkWorks,
  LOOKS,
  PAPER_PRESETS,
  sanitizeDesign,
  type QrDesign,
} from "@/lib/qr-design";
import { contrastRatio } from "@/lib/themes";
import { saveQrDesignAction } from "./actions";

type ShopInfo = { name: string; host: string; logoUrl: string | null; accent: string };
type Product = { id: string; title: string; price: string; target: string };
type Tab = "looks" | "shape" | "colour" | "frame";

const TABS: { id: Tab; label: string }[] = [
  { id: "looks", label: "Looks" },
  { id: "shape", label: "Shape" },
  { id: "colour", label: "Colour" },
  { id: "frame", label: "Frame & words" },
];

async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
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

function Svg({ svg, className = "" }: { svg: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block select-none [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Tile({
  selected,
  onClick,
  label,
  svg,
  thumbClass = "h-16 w-16",
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  svg: string;
  thumbClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-2 rounded-[4px] border-[1.5px] p-2.5 text-sm font-semibold transition-colors ${
        selected ? "border-cobalt bg-cobalt-wash/60" : "border-line bg-card hover:border-line-strong"
      }`}
    >
      <Svg svg={svg} className={thumbClass} />
      <span className="leading-tight">{label}</span>
    </button>
  );
}

function Swatches({
  label,
  value,
  onChange,
  presets,
  noneLabel,
  bg,
  checkInk = true,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  presets: { name: string; hex: string }[];
  noneLabel?: string;
  bg: string;
  checkInk?: boolean;
}) {
  const problem = checkInk && value ? colourProblem(value, bg) : null;
  return (
    <fieldset>
      <legend className="field-label">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        {noneLabel && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-pressed={value === null}
            className={`h-9 rounded-full border-[1.5px] px-3 text-sm font-semibold ${value === null ? "border-cobalt bg-cobalt-wash/60" : "border-line bg-card"}`}
          >
            {noneLabel}
          </button>
        )}
        {presets.map((c) => {
          const selected = value?.toUpperCase() === c.hex.toUpperCase();
          return (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange(c.hex)}
              aria-pressed={selected}
              title={c.name}
              className={`h-9 w-9 rounded-full ${selected ? "ring-2 ring-cobalt ring-offset-2" : ""}`}
              style={{ background: c.hex, boxShadow: "inset 0 0 0 1px rgb(25 28 58 / 0.18)" }}
            >
              <span className="sr-only">{c.name}</span>
            </button>
          );
        })}
        <label className="ml-1 flex items-center gap-2 text-sm">
          <input
            type="color"
            value={value ?? "#191C3A"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-9 w-11 cursor-pointer rounded border border-line-strong bg-card p-0.5"
          />
          Custom
        </label>
      </div>
      {problem && <p className={`mt-2 text-sm ${problem.startsWith("Too") ? "text-stop" : "text-ink-soft"}`}>{problem}</p>}
    </fieldset>
  );
}

export function QrStudio({
  shop,
  locked,
  shopTarget,
  products,
  initialDesign,
  initialItem,
}: {
  shop: ShopInfo;
  locked: boolean;
  shopTarget: string;
  products: Product[];
  initialDesign: QrDesign;
  initialItem: string;
}) {
  const [design, setDesign] = useState<QrDesign>(initialDesign);
  const [item, setItem] = useState(initialItem);
  const [tab, setTab] = useState<Tab>("looks");
  const [view, setView] = useState<"code" | "sign">("code");
  const [customCta, setCustomCta] = useState(!CTA_PRESETS.includes(initialDesign.cta));
  const [save, setSave] = useState<"saved" | "saving" | "idle">("idle");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const safe = useMemo(() => sanitizeDesign(design), [design]);
  const set = (patch: Partial<QrDesign>) => setDesign((d) => ({ ...d, ...patch }));
  const product = products.find((p) => p.id === item);
  const target = product?.target ?? shopTarget;
  const logoHref = safe.logo ? shop.logoUrl : null;

  // Save a moment after the last change.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSave("saving");
    const t = setTimeout(() => {
      startTransition(async () => {
        await saveQrDesignAction(safe);
        setSave("saved");
      });
    }, 700);
    return () => clearTimeout(t);
  }, [safe]);

  const preview = useMemo(
    () => qrSvg(target, { ...safe, logoHref, watermark: locked, subtitle: shop.host, title: locked ? "Preview QR code" : "Your QR code" }),
    [target, safe, logoHref, locked, shop.host],
  );

  // Thumbnails use sample content, so pickers never show a usable code.
  const thumbs = useMemo(() => {
    const base = { ...safe, logo: false };
    const yourShop =
      inkWorks(shop.accent, "#FFFFFF") && contrastRatio(shop.accent, "#FFFFFF") >= 5
        ? [{ id: "shop", name: "Your shop", design: { body: "rounded", eyeFrame: "rounded", eyeBall: "circle", fg: shop.accent.toUpperCase(), fg2: null, eyeColor: null, bg: "#FFFFFF", frame: "banner" } as Partial<QrDesign> }]
        : [];
    return {
      looks: [...yourShop, ...LOOKS].map((l) => ({
        ...l,
        svg: qrSvg(SAMPLE_TEXT, { ...base, ...l.design, cta: "Scan me", subtitle: "myqr.co.nz" }),
      })),
      bodies: BODY_SHAPES.map((b) => ({ ...b, svg: qrSvg(SAMPLE_TEXT, { ...base, body: b.id, frame: "none", margin: 1 }) })),
      eyeFrames: EYE_FRAMES.map((e) => ({ ...e, svg: eyeSwatchSvg(e.id, safe.eyeBall, safe.eyeColor ?? safe.fg) })),
      eyeBalls: EYE_BALLS.map((e) => ({ ...e, svg: eyeSwatchSvg(safe.eyeFrame, e.id, safe.eyeColor ?? safe.fg) })),
      frames: FRAMES.map((fr) => ({ ...fr, svg: qrSvg(SAMPLE_TEXT, { ...base, frame: fr.id, cta: "Scan me", subtitle: "myqr.co.nz" }) })),
    };
  }, [safe, shop.accent]);

  const lookSelected = (d: Partial<QrDesign>) =>
    (Object.keys(d) as (keyof QrDesign)[]).every((k) => String(d[k] ?? "") === String(safe[k] ?? ""));

  async function exportSvg() {
    const data = logoHref ? await toDataUrl(logoHref) : null;
    return {
      svg: qrSvg(target, { ...safe, logoHref: data, subtitle: shop.host }),
      logoDropped: !!logoHref && !data,
    };
  }

  async function downloadSvg() {
    setBusy("svg");
    const { svg, logoDropped } = await exportSvg();
    download(URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), `${shop.host.split(".")[0]}-qr.svg`);
    setNote(logoDropped ? "Your logo couldn't be added to the file, so it was saved without it." : null);
    setBusy(null);
  }

  async function downloadPng(width: number) {
    setBusy(`png${width}`);
    const { svg, logoDropped } = await exportSvg();
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = Math.round((width * img.naturalHeight) / img.naturalWidth) || width;
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) download(URL.createObjectURL(blob), `${shop.host.split(".")[0]}-qr-${width}.png`);
      setBusy(null);
    }, "image/png");
    setNote(logoDropped ? "Your logo couldn't be added to the file, so it was saved without it." : null);
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        {/* ── Controls ─────────────────────────────────────── */}
        <div className="panel min-w-0">
          <div role="tablist" aria-label="Design options" className="flex overflow-x-auto border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px whitespace-nowrap border-b-[2.5px] px-5 py-3.5 text-[0.9375rem] font-semibold ${
                  tab === t.id ? "border-cobalt text-ink" : "border-transparent text-ink-soft hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-8 p-5 sm:p-7" role="tabpanel">
            {tab === "looks" && (
              <div>
                <p className="mb-4 text-[0.9375rem] text-ink-soft">Start from a finished look, then fine-tune it in the other tabs.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {thumbs.looks.map((l) => (
                    <Tile
                      key={l.id}
                      label={l.name}
                      svg={l.svg}
                      thumbClass="h-28 w-full"
                      selected={lookSelected(l.design)}
                      onClick={() => set({ fg2: null, eyeColor: null, frameColor: null, ...l.design })}
                    />
                  ))}
                </div>
              </div>
            )}

            {tab === "shape" && (
              <>
                <fieldset>
                  <legend className="field-label">Pattern</legend>
                  <div className="grid grid-cols-4 gap-2">
                    {thumbs.bodies.map((b) => (
                      <Tile key={b.id} label={b.label} svg={b.svg} thumbClass="h-16 w-16" selected={safe.body === b.id} onClick={() => set({ body: b.id })} />
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="field-label">Corner frames</legend>
                  <div className="grid grid-cols-5 gap-2">
                    {thumbs.eyeFrames.map((e) => (
                      <Tile key={e.id} label={e.label} svg={e.svg} thumbClass="h-11 w-11" selected={safe.eyeFrame === e.id} onClick={() => set({ eyeFrame: e.id })} />
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="field-label">Corner centres</legend>
                  <div className="grid grid-cols-5 gap-2">
                    {thumbs.eyeBalls.map((e) => (
                      <Tile key={e.id} label={e.label} svg={e.svg} thumbClass="h-11 w-11" selected={safe.eyeBall === e.id} onClick={() => set({ eyeBall: e.id })} />
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {tab === "colour" && (
              <>
                <fieldset>
                  <legend className="field-label">Fill</legend>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "solid", label: "Solid colour" },
                      { id: "linear", label: "Gradient" },
                      { id: "radial", label: "Glow from centre" },
                    ].map((o) => {
                      const selected = o.id === "solid" ? !safe.fg2 : !!safe.fg2 && safe.gradient === o.id;
                      return (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            o.id === "solid"
                              ? set({ fg2: null })
                              : set({ gradient: o.id as "linear" | "radial", fg2: design.fg2 ?? (safe.fg === "#1A33B8" ? "#0B5E68" : "#1A33B8") })
                          }
                          className={`rounded-[3px] border-[1.5px] px-3 py-2 text-sm font-semibold ${selected ? "border-cobalt bg-cobalt-wash/60" : "border-line bg-card"}`}
                        >
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <Swatches label={safe.fg2 ? "First colour" : "Code colour"} value={design.fg} onChange={(v) => v && set({ fg: v })} presets={INK_PRESETS} bg={safe.bg} />
                {safe.fg2 !== null && (
                  <Swatches label="Second colour" value={design.fg2} onChange={(v) => v && set({ fg2: v })} presets={INK_PRESETS} bg={safe.bg} />
                )}
                <Swatches
                  label="Corner colour"
                  value={design.eyeColor}
                  onChange={(v) => set({ eyeColor: v })}
                  presets={[...INK_PRESETS.slice(0, 6), { name: "Red", hex: "#B42318" }]}
                  noneLabel="Same as code"
                  bg={safe.bg}
                />
                <Swatches
                  label="Background"
                  value={design.bg}
                  onChange={(v) => v && set({ bg: v })}
                  presets={PAPER_PRESETS}
                  bg={safe.bg}
                  checkInk={false}
                />
                {design.bg !== safe.bg && <p className="-mt-6 text-sm text-stop">Backgrounds need to be light so every phone can read the code.</p>}
              </>
            )}

            {tab === "frame" && (
              <>
                <fieldset>
                  <legend className="field-label">Frame</legend>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
                    {thumbs.frames.map((fr) => (
                      <Tile key={fr.id} label={fr.label} svg={fr.svg} thumbClass="h-20 w-full" selected={safe.frame === fr.id} onClick={() => set({ frame: fr.id })} />
                    ))}
                  </div>
                  <p className="field-hint">Frames are used for downloads and the framed-code print sheet. Signs and cards have their own layout.</p>
                </fieldset>

                {safe.frame !== "none" && (
                  <Swatches
                    label="Frame colour"
                    value={design.frameColor}
                    onChange={(v) => set({ frameColor: v })}
                    presets={INK_PRESETS.slice(0, 10)}
                    noneLabel="Same as code"
                    bg={safe.bg}
                    checkInk={false}
                  />
                )}

                <div>
                  <label htmlFor="qr-cta" className="field-label">
                    Words
                  </label>
                  {customCta ? (
                    <div className="flex gap-2">
                      <input
                        id="qr-cta"
                        className="input"
                        value={design.cta}
                        maxLength={CTA_MAX}
                        onChange={(e) => set({ cta: e.target.value })}
                        placeholder="Scan to shop online"
                      />
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => (setCustomCta(false), set({ cta: CTA_PRESETS[0] }))}>
                        Use a preset
                      </button>
                    </div>
                  ) : (
                    <select
                      id="qr-cta"
                      className="input"
                      value={CTA_PRESETS.includes(design.cta) ? design.cta : CTA_PRESETS[0]}
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

                {shop.logoUrl ? (
                  <label className="flex items-center gap-3 font-medium">
                    <input type="checkbox" checked={design.logo} onChange={(e) => set({ logo: e.target.checked })} className="h-4 w-4 accent-cobalt" />
                    Put my logo in the middle
                  </label>
                ) : (
                  <p className="text-sm text-ink-soft">
                    <Link href="/dashboard/shop#branding" className="underline underline-offset-2">
                      Add a logo
                    </Link>{" "}
                    to put it in the middle of your code.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Stage ─────────────────────────────────────────── */}
        <div className="order-first space-y-4 lg:order-none lg:sticky lg:top-6 lg:self-start">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
              <div className="flex gap-1" role="group" aria-label="Preview">
                {(["code", "sign"] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`rounded-[3px] px-2.5 py-1 text-sm font-semibold ${view === v ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
                  >
                    {v === "code" ? "Code" : "On a sign"}
                  </button>
                ))}
              </div>
              <span className="text-xs text-ink-soft" aria-live="polite">
                {save === "saving" ? "Saving…" : save === "saved" ? "Design saved" : ""}
              </span>
            </div>

            <div
              className="relative grid min-h-[22rem] place-items-center px-6 py-8"
              style={{
                background: `radial-gradient(circle at 1px 1px, rgb(25 28 58 / 0.09) 1px, transparent 0) 0 0 / 16px 16px, ${safe.bg === "#FFFFFF" ? "#F3F4F0" : safe.bg}`,
              }}
              onContextMenu={(e) => locked && e.preventDefault()}
            >
              {locked && (
                <span className="absolute left-3 top-3 rounded-full bg-sticker px-2.5 py-0.5 text-xs font-bold text-ink">Preview</span>
              )}
              {view === "code" ? (
                <Svg
                  svg={preview}
                  className="w-full max-w-[17rem] drop-shadow-[0_14px_22px_rgb(25_28_58/0.18)] transition-[filter] duration-200"
                />
              ) : (
                <div className="w-full max-w-[15rem]">
                  <StallSign
                    name={shop.name}
                    address={shop.host}
                    qrValue={target}
                    sticker={false}
                    design={{ ...safe, logo: false }}
                    watermark={locked}
                    cta={safe.cta}
                  />
                </div>
              )}
            </div>

            <div className="border-t border-line px-4 py-3">
              <label htmlFor="qr-target" className="text-sm font-semibold">
                Opens
              </label>
              <select id="qr-target" className="input mt-1" value={item} onChange={(e) => setItem(e.target.value)}>
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
              <p className="mt-2 text-xs text-ink-soft">
                {locked
                  ? "Scan to test your design: preview codes open a myQR preview page. Your real code opens your shop once it's published."
                  : "Scan it now with your phone camera to test it."}
              </p>
            </div>
          </div>

          {locked ? (
            <div className="border-[1.5px] border-ink bg-sticker/40 p-5">
              <p className="font-bold">Downloads and printing unlock when you publish</p>
              <p className="mt-1 text-sm">
                Your design is saved. Publish your shop and this exact code, without the watermark, is ready to download and print.
              </p>
              <Link href="/dashboard#publish" className="btn btn-ink btn-sm mt-4">
                Go to publish
              </Link>
            </div>
          ) : (
            <div className="panel space-y-2 p-5">
              <p className="font-bold">Download</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => downloadPng(1200)} disabled={!!busy}>
                  {busy === "png1200" ? "Preparing…" : "PNG"}
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
          )}
        </div>
      </div>

      <section aria-labelledby="print">
        <h2 id="print" className="font-semiwide text-2xl">
          {locked ? "Print sheets (preview)" : "Print-ready sheets"}
        </h2>
        <p className="mt-1 text-ink-soft">
          {locked
            ? "See how your sheets will look. Printing unlocks when your shop is published."
            : "Each opens a page sized for A4. Print at 100% (actual size), not “fit to page”. Sheets use your saved design."}
        </p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t) => {
            const disabled = t.id === "tags" && products.length === 0;
            const query = t.id === "tags" ? (item ? `?items=${item}` : "") : item ? `?item=${item}` : "";
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
                  <a href={`/print/${t.id}${query}`} target="_blank" rel="noopener" className={`btn btn-sm mt-4 self-start ${locked ? "btn-outline" : "btn-primary"}`}>
                    {locked ? "Preview sheet" : "Open and print"}
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
