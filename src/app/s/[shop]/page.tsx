import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { JsonLd } from "@/components/JsonLd";
import { EnquiryForm } from "@/components/storefront/EnquiryForm";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StripQrParam } from "@/components/storefront/StripQrParam";
import { shopUrl } from "@/config/site";
import { getPublicListings, recordVisit } from "@/lib/shops";
import { shopSeoDescription, shopSeoTitle } from "@/lib/seo";
import { absoluteAsset, loadStorefront, socialLinks } from "@/lib/storefront";

type Props = {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ c?: string; qr?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ctx = await loadStorefront((await params).shop);
  if (!ctx) return {};
  const { shop } = ctx;
  const url = shopUrl(shop.subdomain);
  const title = shopSeoTitle(shop);
  const description = shopSeoDescription(shop);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: shop.name,
      title,
      description,
      locale: "en_NZ",
      images: [{ url: shopUrl(shop.subdomain, "/og"), width: 1200, height: 630, alt: shop.name }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ShopHome({ params, searchParams }: Props) {
  const ctx = await loadStorefront((await params).shop);
  if (!ctx) notFound();
  const { shop, base, isPublic, isPathPreview } = ctx;
  const sp = await searchParams;

  if (isPublic && !isPathPreview) {
    const ua = (await headers()).get("user-agent");
    after(() => recordVisit(shop.id, sp.qr !== undefined ? "qr" : "web", ua));
  }

  const all = await getPublicListings(shop.id);
  const categories = [...new Set(all.map((l) => l.category).filter(Boolean))] as string[];
  const active = sp.c && categories.includes(sp.c) ? sp.c : null;
  const shown = active ? all.filter((l) => l.category === active) : all;
  const social = socialLinks(shop);
  const url = shopUrl(shop.subdomain);

  return (
    <>
      {sp.qr !== undefined && <StripQrParam />}

      {shop.coverUrl && (
        <div className="mx-auto max-w-6xl sm:px-6 sm:pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={shop.coverUrl}
            alt=""
            fetchPriority="high"
            className="aspect-[2/1] w-full object-cover sm:aspect-[3/1]"
            style={{ borderRadius: "var(--s-radius)" }}
          />
        </div>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
        <h1 className="s-heading max-w-3xl text-[clamp(2.1rem,6vw,3.6rem)]">{shop.name}</h1>
        {shop.tagline && <p className="s-muted mt-3 max-w-2xl text-lg sm:text-xl">{shop.tagline}</p>}
        {(shop.location || shop.region) && (
          <p className="mt-3 text-sm font-semibold">{[shop.location, shop.region].filter(Boolean).join(", ")}</p>
        )}
      </section>

      <section aria-labelledby="products" className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="products" className="s-heading text-2xl">
            {active ?? "Shop"}
          </h2>
          {categories.length > 1 && (
            <nav aria-label="Categories" className="flex flex-wrap gap-2">
              <Link
                href={base || "/"}
                className={`s-btn !min-h-9 !px-3 !py-1 text-sm ${active ? "s-btn-ghost" : ""}`}
                aria-current={!active ? "page" : undefined}
              >
                All
              </Link>
              {categories.map((c) => (
                <Link
                  key={c}
                  href={`${base || "/"}?c=${encodeURIComponent(c)}`}
                  className={`s-btn !min-h-9 !px-3 !py-1 text-sm ${active === c ? "" : "s-btn-ghost"}`}
                  aria-current={active === c ? "page" : undefined}
                >
                  {c}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {shown.length > 0 ? (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((l) => (
              <li key={l.id} className="flex">
                <ProductCard listing={l} base={base} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="s-muted mt-6">New products are on their way. Send a message below to ask what&apos;s available.</p>
        )}
      </section>

      <section id="about" className="mx-auto mt-20 grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="space-y-8">
          {shop.description && (
            <div>
              <h2 className="s-heading text-2xl">About us</h2>
              <p className="mt-3 max-w-[62ch] whitespace-pre-line leading-relaxed">{shop.description}</p>
            </div>
          )}
          {shop.marketInfo && (
            <div>
              <h2 className="s-heading text-xl">Find us</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{shop.marketInfo}</p>
            </div>
          )}
          {shop.pickupInfo && (
            <div>
              <h2 className="s-heading text-xl">Pickup</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed">{shop.pickupInfo}</p>
            </div>
          )}
          {(shop.phone || (shop.showEmail && shop.contactEmail) || social.length > 0) && (
            <div>
              <h2 className="s-heading text-xl">Contact</h2>
              <ul className="mt-2 space-y-1">
                {shop.phone && (
                  <li>
                    <a href={`tel:${shop.phone.replace(/\s/g, "")}`} className="s-link">
                      {shop.phone}
                    </a>
                  </li>
                )}
                {shop.showEmail && shop.contactEmail && (
                  <li>
                    <a href={`mailto:${shop.contactEmail}`} className="s-link">
                      {shop.contactEmail}
                    </a>
                  </li>
                )}
                {social.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} rel="noopener me" target="_blank" className="s-link">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div id="contact" className="scroll-mt-6">
          <h2 className="s-heading text-2xl">Send us a message</h2>
          <p className="s-muted mb-5 mt-2">Questions, custom orders or pickup times. We&apos;ll reply by email.</p>
          {isPublic ? (
            <EnquiryForm shop={shop.subdomain} />
          ) : (
            <p className="s-card p-4 text-sm">The message form works once your shop is published.</p>
          )}
        </div>
      </section>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Store",
          name: shop.name,
          url,
          description: shopSeoDescription(shop),
          logo: absoluteAsset(shop.subdomain, shop.logoUrl),
          image: absoluteAsset(shop.subdomain, shop.coverUrl ?? shop.logoUrl),
          telephone: shop.phone ?? undefined,
          email: shop.showEmail ? (shop.contactEmail ?? undefined) : undefined,
          address:
            shop.location || shop.region
              ? {
                  "@type": "PostalAddress",
                  addressLocality: shop.location ?? undefined,
                  addressRegion: shop.region ?? undefined,
                  addressCountry: "NZ",
                }
              : undefined,
          sameAs: social.map((s) => s.href),
          currenciesAccepted: "NZD",
        }}
      />
      {all.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: all
              .filter((l) => l.status === "active")
              .slice(0, 50)
              .map((l, i) => ({ "@type": "ListItem", position: i + 1, url: shopUrl(shop.subdomain, `/p/${l.slug}`), name: l.title })),
          }}
        />
      )}
    </>
  );
}
