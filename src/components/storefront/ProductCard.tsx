import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ListingWithImages } from "@/lib/shops";

export function ProductCard({ listing, base }: { listing: ListingWithImages; base: string }) {
  const img = listing.images[0];
  const sold = listing.status === "sold";
  return (
    <Link href={`${base}/p/${listing.slug}`} className="group s-card flex flex-col">
      <div className="relative aspect-square overflow-hidden" style={{ background: "var(--s-line)" }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img.url}
            alt={img.alt || listing.title}
            loading="lazy"
            decoding="async"
            width={img.width ?? undefined}
            height={img.height ?? undefined}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] ${sold ? "opacity-60 grayscale-[40%]" : ""}`}
          />
        ) : (
          <div className="s-muted grid h-full place-items-center text-sm">No photo</div>
        )}
        {sold && <span className="s-tag absolute left-2 top-2">Sold</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{listing.title}</h3>
        <div className="mt-auto pt-1">
          <p className="font-bold">{formatPrice(listing.priceCents)}</p>
          <p className="s-muted text-sm">
            {listing.shippingCents === null
              ? "Pickup only"
              : listing.shippingCents === 0
                ? "Free shipping"
                : `+ ${formatPrice(listing.shippingCents)} shipping`}
          </p>
        </div>
      </div>
    </Link>
  );
}
