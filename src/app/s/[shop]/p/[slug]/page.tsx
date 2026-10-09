import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { JsonLd } from "@/components/JsonLd";
import { EnquiryForm } from "@/components/storefront/EnquiryForm";
import { BuyBox } from "@/components/storefront/BuyBox";
import { Gallery } from "@/components/storefront/Gallery";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StripQrParam } from "@/components/storefront/StripQrParam";
import { shopUrl } from "@/config/site";
import { formatPrice } from "@/lib/format";
import { listingSeoDescription, listingSeoTitle } from "@/lib/seo";
import { getPublicListing, getPublicListings, recordVisit } from "@/lib/shops";
import { MAX_QTY } from "@/lib/orders";
import { absoluteAsset, loadStorefront } from "@/lib/storefront";
import { paymentsLive } from "@/lib/stripe";

type Props = {
  params: Promise<{ shop: string; slug: string }>;
  searchParams: Promise<{ qr?: string; checkout?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shop: sub, slug } = await params;
  const ctx = await loadStorefront(sub);
  if (!ctx) return {};
  const listing = await getPublicListing(ctx.shop.id, slug);
  if (!listing) return {};
  const title = listingSeoTitle(listing, ctx.shop);
  const description = listingSeoDescription(listing, ctx.shop);
  const url = shopUrl(sub, `/p/${listing.slug}`);
  const image = listing.images[0];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: ctx.shop.name,
      title,
      description,
      locale: "en_NZ",
      images: image
        ? [{ url: absoluteAsset(sub, image.url)!, width: image.width ?? undefined, height: image.height ?? undefined, alt: listing.title }]
        : [{ url: shopUrl(sub, "/og"), width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function availability(quantity: number | null, status: string) {
  if (status === "sold") return { label: "Sold", schema: "https://schema.org/SoldOut", inStock: false };
  // Stock is held while someone else is at checkout.
  if (quantity === 0) return { label: "Someone is checking out with the last one. Check back in half an hour.", schema: "https://schema.org/SoldOut", inStock: false };
  if (quantity === null) return { label: "Available to order", schema: "https://schema.org/InStock", inStock: true };
  if (quantity === 1) return { label: "One available", schema: "https://schema.org/LimitedAvailability", inStock: true };
  return { label: `${quantity} available`, schema: "https://schema.org/InStock", inStock: true };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { shop: sub, slug } = await params;
  const ctx = await loadStorefront(sub);
  if (!ctx) notFound();
  const { shop, base, isPublic, isPathPreview } = ctx;
  const listing = await getPublicListing(shop.id, slug);
  if (!listing) notFound();
  const sp = await searchParams;

  if (isPublic && !isPathPreview) {
    const ua = (await headers()).get("user-agent");
    after(() => recordVisit(shop.id, sp.qr !== undefined ? "qr" : "web", ua));
  }

  const avail = availability(listing.quantity, listing.status);
  const canBuy = paymentsLive();
  const others = (await getPublicListings(shop.id)).filter((l) => l.id !== listing.id && l.status === "active").slice(0, 4);
  const url = shopUrl(sub, `/p/${listing.slug}`);
  const deliveryLines = [
    listing.shippingCents === null
      ? null
      : listing.shippingCents === 0
        ? "Free shipping within New Zealand"
        : `Shipping within New Zealand: ${formatPrice(listing.shippingCents)}`,
    listing.pickup ? `Pickup available${shop.location ? ` in ${shop.location}` : ""}` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {sp.qr !== undefined && <StripQrParam />}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <Link href={base || "/"} className="s-muted text-sm hover:underline">
          ← All products from {shop.name}
        </Link>
      </div>

      <article className="mx-auto mt-6 grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <Gallery images={listing.images} title={listing.title} />

        <div>
          {listing.category && <p className="s-muted text-sm font-semibold">{listing.category}</p>}
          <h1 className="s-heading mt-1 text-[clamp(1.8rem,4.5vw,2.8rem)]">{listing.title}</h1>
          <p className="mt-4 text-2xl font-bold">{formatPrice(listing.priceCents)}</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: avail.inStock ? "var(--s-accent)" : "var(--s-muted)" }}>
            {avail.label}
          </p>

          {deliveryLines.length > 0 && (
            <ul className="s-card mt-6 space-y-1.5 p-4 text-[0.9375rem]">
              {deliveryLines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          )}

          {sp.checkout === "cancelled" && (
            <p role="status" className="s-card mt-6 p-3 text-sm">
              Checkout cancelled. You haven&apos;t been charged.
            </p>
          )}

          {avail.inStock && isPublic && canBuy && (
            <BuyBox
              shop={shop.subdomain}
              listingId={listing.id}
              priceCents={listing.priceCents}
              shippingCents={listing.shippingCents}
              pickup={listing.pickup}
              maxQuantity={listing.quantity === null ? MAX_QTY : Math.min(MAX_QTY, listing.quantity)}
              pickupNote={shop.pickupInfo}
            />
          )}
          {avail.inStock && isPublic && !canBuy && (
            <a href="#order" className="s-btn mt-6 w-full sm:w-auto">
              Order this item
            </a>
          )}

          {listing.description && (
            <div className="mt-8">
              <h2 className="sr-only">Description</h2>
              <p className="max-w-[62ch] whitespace-pre-line leading-relaxed">{listing.description}</p>
            </div>
          )}
        </div>
      </article>

      <section id="order" className="mx-auto mt-16 max-w-3xl scroll-mt-6 px-4 sm:px-6">
        <h2 className="s-heading text-2xl">{avail.inStock && !canBuy ? "Order this item" : "Ask about this item"}</h2>
        <p className="s-muted mb-5 mt-2">
          {avail.inStock && !canBuy
            ? `Send your details and ${shop.name} will reply by email to arrange payment and ${listing.shippingCents === null ? "pickup" : "delivery or pickup"}.`
            : avail.inStock
              ? `Questions about size, colour or delivery? ${shop.name} will reply by email.`
              : "It's sold, but there may be more like it. Ask and the seller will reply by email."}
        </p>
        {isPublic ? (
          <EnquiryForm
            shop={shop.subdomain}
            listingId={listing.id}
            submitLabel={avail.inStock && !canBuy ? "Send order request" : "Send question"}
            deliveryChoice={avail.inStock && !canBuy && listing.shippingCents !== null && listing.pickup}
            defaultMessage={
              avail.inStock
                ? canBuy
                  ? `Hi, I have a question about the ${listing.title}.`
                  : `Hi, I'd like to order the ${listing.title} (${formatPrice(listing.priceCents)}).`
                : `Hi, will you have more of the ${listing.title}?`
            }
          />
        ) : (
          <p className="s-card p-4 text-sm">Ordering opens once the shop is published.</p>
        )}
      </section>

      {others.length > 0 && (
        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6" aria-labelledby="more">
          <h2 id="more" className="s-heading text-2xl">
            More from {shop.name}
          </h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
            {others.map((l) => (
              <li key={l.id} className="flex">
                <ProductCard listing={l} base={base} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: listing.title,
          description: listingSeoDescription(listing, shop),
          url,
          image: listing.images.map((i) => absoluteAsset(sub, i.url)),
          category: listing.category ?? undefined,
          brand: { "@type": "Brand", name: shop.name },
          offers: {
            "@type": "Offer",
            url,
            price: (listing.priceCents / 100).toFixed(2),
            priceCurrency: "NZD",
            availability: avail.schema,
            itemCondition: "https://schema.org/NewCondition",
            seller: { "@type": "Organization", name: shop.name, url: shopUrl(sub) },
            ...(listing.shippingCents !== null && {
              shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingRate: { "@type": "MonetaryAmount", value: (listing.shippingCents / 100).toFixed(2), currency: "NZD" },
                shippingDestination: { "@type": "DefinedRegion", addressCountry: "NZ" },
              },
            }),
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: shop.name, item: shopUrl(sub) },
            { "@type": "ListItem", position: 2, name: listing.title, item: url },
          ],
        }}
      />
    </>
  );
}
