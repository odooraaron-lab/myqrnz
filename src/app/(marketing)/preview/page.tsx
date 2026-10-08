import type { Metadata } from "next";
import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { shopHost, shopUrl, site } from "@/config/site";
import { getShopBySubdomain } from "@/lib/shops";
import { subdomainProblem } from "@/lib/subdomain";

export const metadata: Metadata = {
  title: "Preview QR code",
  description: "This QR code is a preview made with myQR.",
  robots: { index: false, follow: true },
};

/** Where every preview QR code lands. Turns a scanned preview into a reason to sign up. */
export default async function PreviewPage({ searchParams }: { searchParams: Promise<{ s?: string; p?: string }> }) {
  const { s } = await searchParams;
  const sub = typeof s === "string" ? s.toLowerCase().slice(0, 40) : "";
  const shop = sub ? await getShopBySubdomain(sub).catch(() => null) : null;
  const claimable = !!sub && !shop && !subdomainProblem(sub);

  let heading = "This is a preview QR code";
  let body = "It was made with myQR to try out a design. Preview codes don't open a shop.";
  let action: { href: string; label: string } = { href: "/register", label: "Make a QR code for your shop" };

  if (shop?.status === "live") {
    heading = `${shop.name} is open online`;
    body = "This is an old preview of their QR code. Their shop is live now.";
    action = { href: shopUrl(shop.subdomain), label: `Visit ${shop.name}` };
  } else if (shop) {
    heading = `${shop.name} is getting ready`;
    body = `This is a preview of their QR code. Once their shop opens, the real code will take you straight to ${shopHost(shop.subdomain)}.`;
    action = { href: "/", label: "See how myQR works" };
  } else if (claimable) {
    heading = `${shopHost(sub)} is still available`;
    body = "This is a preview code from myQR. Claim the name to get your own shop and a real QR code for your stall or counter.";
    action = { href: `/register?name=${encodeURIComponent(sub.replace(/-/g, " "))}`, label: `Claim ${sub}` };
  }

  return (
    <section className="mx-auto max-w-xl px-4 py-16 sm:py-24">
      <div className="panel p-7 sm:p-10">
        <div className="flex items-center gap-3">
          <LogoMark className="text-cobalt" size={28} />
          <span className="rounded-full bg-sticker px-2.5 py-0.5 text-sm font-bold">Preview code</span>
        </div>
        <h1 className="font-wide mt-6 text-[clamp(1.8rem,6vw,2.6rem)]">{heading}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-soft">{body}</p>
        <Link href={action.href} className="btn btn-primary mt-8 w-full sm:w-auto">
          {action.label}
        </Link>
        <p className="mt-8 border-t border-line pt-5 text-sm text-ink-soft">
          Selling at a market or from a small shop? myQR gives you an online store and a printable QR code for a one-off
          ${site.setupFee}. No monthly fees.
        </p>
      </div>
    </section>
  );
}
