import Link from "next/link";
import { PageHead } from "@/components/dashboard/PageHead";
import { shopHost, shopUrl } from "@/config/site";
import { requireSeller } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { qrUnlocked } from "@/lib/payments";
import { previewTarget, qrTarget } from "@/lib/qr";
import { shopDesign } from "@/lib/qr-design";
import { getAllListingsForShop } from "@/lib/shops";
import { getTheme, isHexColor } from "@/lib/themes";
import { QrStudio } from "./QrStudio";

export const metadata = { title: "QR codes" };

export default async function QrPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { shop } = await requireSeller();
  const { item } = await searchParams;
  const unlocked = qrUnlocked(shop);
  const base = shopUrl(shop.subdomain);
  const listings = (await getAllListingsForShop(shop.id)).filter((l) => l.status === "active" || l.status === "sold");
  const accent = isHexColor(shop.accentColor) ? shop.accentColor : getTheme(shop.theme).colors.accent;

  // In preview mode the browser only ever receives preview links, never the real shop code.
  const target = (slug?: string) => (unlocked ? qrTarget(base, slug ? `/p/${slug}` : "") : previewTarget(shop.subdomain, slug));

  return (
    <>
      <PageHead
        title="QR codes"
        intro={
          unlocked
            ? "Design your code, then download it or print signs, cards and price tags. Printed codes never go out of date."
            : "Design your code now. You're in preview mode until your shop is published: codes carry a watermark, and downloads and printing unlock when you go live."
        }
        actions={
          unlocked ? undefined : (
            <Link href="/dashboard#publish" className="btn btn-primary btn-sm">
              Publish to unlock
            </Link>
          )
        }
      />
      <QrStudio
        shop={{ name: shop.name, host: shopHost(shop.subdomain), logoUrl: shop.logoUrl, accent }}
        locked={!unlocked}
        shopTarget={target()}
        products={listings.map((l) => ({ id: l.id, title: l.title, price: formatPrice(l.priceCents), target: target(l.slug) }))}
        initialDesign={shopDesign(shop)}
        initialItem={listings.some((l) => l.id === item) ? item! : ""}
      />
    </>
  );
}
