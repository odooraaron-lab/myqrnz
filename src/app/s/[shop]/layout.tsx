import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { rootUrl, shopHost } from "@/config/site";
import { baseShopMetadata, loadStorefront, socialLinks } from "@/lib/storefront";
import { themeStyle } from "@/lib/themes";

export async function generateMetadata({ params }: { params: Promise<{ shop: string }> }): Promise<Metadata> {
  const ctx = await loadStorefront((await params).shop);
  if (!ctx) return {};
  return baseShopMetadata(ctx);
}

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ shop: string }>;
}) {
  const ctx = await loadStorefront((await params).shop);
  if (!ctx) notFound();
  const { shop, base, isOwner, isPublic } = ctx;
  const style = themeStyle(shop.theme, shop.accentColor) as React.CSSProperties;

  if (shop.status === "suspended" && !isOwner) {
    return (
      <div className="storefront grid place-items-center px-4 text-center" style={style}>
        <div>
          <h1 className="s-heading text-3xl">{shop.name}</h1>
          <p className="s-muted mt-3">This shop isn&apos;t available right now.</p>
        </div>
      </div>
    );
  }

  if (!isPublic && !isOwner) {
    return (
      <div className="storefront grid place-items-center px-4 py-20 text-center" style={style}>
        <div className="max-w-md">
          {shop.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" className="mx-auto mb-6 h-24 w-24 object-contain" />
          )}
          <h1 className="s-heading text-[clamp(2rem,6vw,3rem)]">{shop.name}</h1>
          {shop.tagline && <p className="s-muted mt-3 text-lg">{shop.tagline}</p>}
          <p className="mt-8">Our online shop opens soon. Check back shortly.</p>
          {shop.marketInfo && <p className="s-muted mt-3 whitespace-pre-line">{shop.marketInfo}</p>}
        </div>
      </div>
    );
  }

  const social = socialLinks(shop);

  return (
    <div className="storefront flex flex-col" style={style}>
      {!isPublic && isOwner && (
        <div className="bg-sticker px-4 py-2.5 text-center text-sm font-semibold text-[#191c3a]">
          Preview — only you can see this until you publish.{" "}
          <Link href="/dashboard" className="underline">
            Back to dashboard
          </Link>
        </div>
      )}
      <header className="s-line border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href={base || "/"} className="flex min-w-0 items-center gap-3">
            {shop.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shop.logoUrl} alt="" className="h-10 w-10 shrink-0 object-contain" />
            )}
            <span className="s-heading truncate text-xl">{shop.name}</span>
          </Link>
          <Link href={`${base || "/"}#contact`} className="s-btn s-btn-ghost !min-h-10 !px-4 text-sm">
            Contact
          </Link>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="s-line mt-20 border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="s-heading text-lg">{shop.name}</p>
            <p className="s-muted mt-1 text-sm">
              {[shop.location, shop.region].filter(Boolean).join(", ") || shopHost(shop.subdomain)}
            </p>
            {social.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-4 text-sm">
                {social.map((s) => (
                  <li key={s.href}>
                    <a href={s.href} rel="noopener me" target="_blank" className="s-link">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <a href={rootUrl(`/?ref=${shop.subdomain}`)} className="s-muted text-sm hover:underline">
            Shop made with myQR. Make yours.
          </a>
        </div>
      </footer>
    </div>
  );
}
