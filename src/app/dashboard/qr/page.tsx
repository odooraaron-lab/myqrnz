import { PageHead } from "@/components/dashboard/PageHead";
import { shopHost, shopUrl } from "@/config/site";
import { requireSeller } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { getAllListingsForShop } from "@/lib/shops";
import { getTheme, isHexColor } from "@/lib/themes";
import { QrStudio } from "./QrStudio";

export const metadata = { title: "QR codes" };

export default async function QrPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { shop } = await requireSeller();
  const { item } = await searchParams;
  const listings = (await getAllListingsForShop(shop.id)).filter((l) => l.status === "active" || l.status === "sold");
  const accent = isHexColor(shop.accentColor) ? shop.accentColor : getTheme(shop.theme).colors.accent;

  return (
    <>
      <PageHead
        title="QR codes"
        intro={
          shop.status === "live"
            ? "Design your code, then print signs, cards and price tags. Every code opens your shop, so printed copies never go out of date."
            : "Your code is ready to print now. It will open your shop once you publish it."
        }
      />
      <QrStudio
        shop={{
          name: shop.name,
          subdomain: shop.subdomain,
          host: shopHost(shop.subdomain),
          url: shopUrl(shop.subdomain),
          logoUrl: shop.logoUrl,
          accent,
        }}
        products={listings.map((l) => ({ id: l.id, title: l.title, slug: l.slug, price: formatPrice(l.priceCents) }))}
        initialItem={listings.some((l) => l.id === item) ? item! : ""}
      />
    </>
  );
}
