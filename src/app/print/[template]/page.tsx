import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { shopHost, shopUrl } from "@/config/site";
import type { Shop } from "@/db/schema";
import { requireSeller } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { qrSvg, qrTarget } from "@/lib/qr";
import { parseQrDesign, TEMPLATES, type QrDesign } from "@/lib/qr-options";
import { getAllListingsForShop, type ListingWithImages } from "@/lib/shops";
import { PrintButton } from "./PrintButton";

export const metadata: Metadata = { title: "Print QR codes", robots: { index: false } };

type Props = {
  params: Promise<{ template: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function Qr({ value, design, logo, className = "" }: { value: string; design: QrDesign; logo: string | null; className?: string }) {
  return (
    <div
      className={`[&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: qrSvg(value, { style: design.style, fg: design.fg, margin: 2, logo }) }}
    />
  );
}

function chunk<T>(list: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out.length ? out : [[]];
}

export default async function PrintPage({ params, searchParams }: Props) {
  const { template } = await params;
  const meta = TEMPLATES.find((t) => t.id === template);
  if (!meta) notFound();
  const { shop } = await requireSeller();
  const sp = await searchParams;
  const design = parseQrDesign(sp);
  const logo = design.logo ? shop.logoUrl : null;

  const listings = (await getAllListingsForShop(shop.id)).filter((l) => l.status === "active");
  const one = typeof sp.item === "string" ? listings.find((l) => l.id === sp.item) : undefined;
  const items = sp.items === "all" || !sp.items ? listings : listings.filter((l) => String(sp.items).split(",").includes(l.id));

  const base = shopUrl(shop.subdomain);
  const target = qrTarget(base, one ? `/p/${one.slug}` : "");
  const address = one ? `${shopHost(shop.subdomain)}/p/${one.slug}` : shopHost(shop.subdomain);
  const landscape = template === "tent";

  return (
    <div className="min-h-dvh bg-[#e7e8e2] print:bg-white">
      <style>{`@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 0; } @media print { html, body { background: #fff !important; } }`}</style>
      <div className="no-print sticky top-0 z-10 border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-bold">{meta.name}</p>
            <p className="text-sm text-ink-soft">Print at 100% (actual size) on A4. Turn off &ldquo;fit to page&rdquo; and headers/footers.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/qr${one ? `?item=${one.id}` : ""}`} className="btn btn-outline btn-sm">
              Back
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 py-8 print:block print:p-0">
        {template === "sign" && <Sign shop={shop} design={design} logo={logo} target={target} address={address} product={one} />}
        {template === "tent" && <Tent shop={shop} design={design} logo={logo} target={target} address={address} />}
        {template === "cards" && <Cards shop={shop} design={design} logo={logo} target={target} address={address} />}
        {template === "stickers" && <Stickers design={design} logo={logo} target={target} address={address} />}
        {template === "tags" &&
          (items.length ? (
            chunk(items, 12).map((page, i) => <Tags key={i} shop={shop} design={design} logo={logo} base={base} items={page} />)
          ) : (
            <p className="no-print text-ink-soft">No products are for sale yet.</p>
          ))}
      </div>
    </div>
  );
}

const sheet = "print-sheet relative overflow-hidden bg-white text-[#111] shadow-[0_6px_30px_rgb(0_0_0/0.12)] print:break-after-page";

function Sign({
  shop,
  design,
  logo,
  target,
  address,
  product,
}: {
  shop: Shop;
  design: QrDesign;
  logo: string | null;
  target: string;
  address: string;
  product?: ListingWithImages;
}) {
  return (
    <section className={sheet} style={{ width: "210mm", height: "297mm" }}>
      <div style={{ height: "9mm", background: design.fg }} />
      <div className="flex h-[288mm] flex-col px-[18mm] pb-[14mm] pt-[14mm]">
        <div className="flex items-center gap-[5mm]">
          {shop.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" style={{ height: "22mm", width: "22mm", objectFit: "contain" }} />
          )}
          <p className="font-wide" style={{ fontSize: shop.name.length > 22 ? "26pt" : "34pt", lineHeight: 1.02 }}>
            {shop.name}
          </p>
        </div>
        <p className="font-semiwide mt-[8mm]" style={{ fontSize: "24pt", color: design.fg }}>
          {product ? `${product.title}, ${formatPrice(product.priceCents)}` : design.cta}
        </p>
        <div className="mx-auto mt-[8mm]" style={{ width: "162mm", height: "162mm" }}>
          <Qr value={target} design={design} logo={logo} className="h-full w-full" />
        </div>
        <p className="font-narrow mt-[6mm] text-center font-bold" style={{ fontSize: "20pt" }}>
          {address}
        </p>
        <p className="mt-auto text-center" style={{ fontSize: "13pt", color: "#555" }}>
          {product ? design.cta : "Browse everything we sell and order for pickup or delivery."}
          {shop.location && (
            <>
              <br />
              {shop.name}, {shop.location}
            </>
          )}
        </p>
      </div>
    </section>
  );
}

function TentPanel({ shop, design, logo, target, address }: { shop: Shop; design: QrDesign; logo: string | null; target: string; address: string }) {
  return (
    <div className="flex h-full items-center gap-[10mm] px-[16mm]">
      <div style={{ width: "88mm", height: "88mm" }} className="shrink-0">
        <Qr value={target} design={design} logo={logo} className="h-full w-full" />
      </div>
      <div className="min-w-0">
        {shop.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shop.logoUrl} alt="" style={{ height: "16mm", width: "16mm", objectFit: "contain", marginBottom: "4mm" }} />
        )}
        <p className="font-wide" style={{ fontSize: shop.name.length > 18 ? "20pt" : "26pt", lineHeight: 1.05 }}>
          {shop.name}
        </p>
        <p className="font-semiwide mt-[5mm]" style={{ fontSize: "17pt", color: design.fg }}>
          {design.cta}
        </p>
        <p className="font-narrow mt-[5mm] break-all font-bold" style={{ fontSize: "13pt" }}>
          {address}
        </p>
      </div>
    </div>
  );
}

function Tent(props: { shop: Shop; design: QrDesign; logo: string | null; target: string; address: string }) {
  return (
    <section className={sheet} style={{ width: "297mm", height: "210mm" }}>
      <div className="flex h-full flex-col">
        {/* Top half is upside down so both faces read correctly once folded. */}
        <div style={{ height: "105mm", transform: "rotate(180deg)" }}>
          <TentPanel {...props} />
        </div>
        <div style={{ height: "105mm" }}>
          <TentPanel {...props} />
        </div>
      </div>
      <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#bbb]" aria-hidden="true" />
      <p className="no-print absolute right-3 top-1/2 -translate-y-1/2 bg-white px-2 text-xs text-[#888]">Fold here</p>
    </section>
  );
}

function Cards({ shop, design, logo, target, address }: { shop: Shop; design: QrDesign; logo: string | null; target: string; address: string }) {
  return (
    <section className={sheet} style={{ width: "210mm", height: "297mm" }}>
      <div className="grid grid-cols-2" style={{ padding: "11mm 20mm", gridAutoRows: "55mm", gridTemplateColumns: "85mm 85mm" }}>
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex items-center gap-[4mm] border border-dashed border-[#ccc] px-[4mm]">
            <div style={{ width: "40mm", height: "40mm" }} className="shrink-0">
              <Qr value={target} design={design} logo={logo} className="h-full w-full" />
            </div>
            <div className="min-w-0">
              <p className="font-semiwide" style={{ fontSize: shop.name.length > 20 ? "10pt" : "12pt", lineHeight: 1.1 }}>
                {shop.name}
              </p>
              <p className="mt-[2mm] font-semibold" style={{ fontSize: "8.5pt", color: design.fg }}>
                {design.cta}
              </p>
              <p className="font-narrow mt-[2mm] break-all font-bold" style={{ fontSize: "8pt" }}>
                {address}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stickers({ design, logo, target, address }: { design: QrDesign; logo: string | null; target: string; address: string }) {
  return (
    <section className={sheet} style={{ width: "210mm", height: "297mm" }}>
      <div className="grid" style={{ padding: "13.5mm 15mm", gridTemplateColumns: "repeat(4, 45mm)", gridAutoRows: "45mm" }}>
        {Array.from({ length: 24 }, (_, i) => (
          <div key={i} className="flex flex-col items-center justify-center border border-dashed border-[#ddd]">
            <div style={{ width: "34mm", height: "34mm" }}>
              <Qr value={target} design={design} logo={logo} className="h-full w-full" />
            </div>
            <p className="font-narrow mt-[1mm] max-w-[42mm] truncate font-bold" style={{ fontSize: "6.5pt" }}>
              {address}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Tags({ shop, design, logo, base, items }: { shop: Shop; design: QrDesign; logo: string | null; base: string; items: ListingWithImages[] }) {
  return (
    <section className={sheet} style={{ width: "210mm", height: "297mm" }}>
      <div className="grid" style={{ padding: "8.5mm 10.5mm", gridTemplateColumns: "repeat(3, 63mm)", gridAutoRows: "70mm" }}>
        {items.map((l) => (
          <div key={l.id} className="flex flex-col border border-dashed border-[#ccc] p-[4mm]">
            <p className="line-clamp-2 font-semibold" style={{ fontSize: "10pt", lineHeight: 1.2, minHeight: "24pt" }}>
              {l.title}
            </p>
            <p className="font-wide mt-[1mm]" style={{ fontSize: "20pt" }}>
              {formatPrice(l.priceCents)}
            </p>
            <div className="mt-auto flex items-end gap-[3mm]">
              <div style={{ width: "30mm", height: "30mm" }} className="shrink-0">
                <Qr value={qrTarget(base, `/p/${l.slug}`)} design={design} logo={logo} className="h-full w-full" />
              </div>
              <p className="min-w-0" style={{ fontSize: "7.5pt", lineHeight: 1.25 }}>
                <span className="font-semibold" style={{ color: design.fg }}>
                  Scan to order
                  {l.shippingCents !== null ? " for delivery" : ""}
                </span>
                <br />
                <span className="line-clamp-2">{shop.name}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
