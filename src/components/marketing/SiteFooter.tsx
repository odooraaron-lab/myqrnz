import Link from "next/link";
import { Logo } from "@/components/Logo";
import { site } from "@/config/site";
import { GUIDES } from "@/content/guides";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_1fr_1fr_1.4fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-ink-soft">
            Online stores and printable QR codes for market stalls and small shops across Aotearoa New Zealand.
          </p>
          <p className="mt-4 text-sm text-ink-soft">
            <a href={`mailto:${site.contactEmail}`} className="underline underline-offset-2 hover:text-ink">
              {site.contactEmail}
            </a>
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            ["/how-it-works", "How it works"],
            ["/pricing", "Pricing"],
            ["/faq", "Questions"],
            ["/register", "Start your shop"],
            ["/login", "Log in"],
          ]}
        />
        <FooterCol
          title="Who it's for"
          links={[
            ["/market-stalls", "Market stalls"],
            ["/small-business", "Small shops"],
            ["/guides/qr-code-for-market-stall", "QR codes for stalls"],
            ["/guides/how-to-start-an-online-store-nz", "Start an online store"],
          ]}
        />
        <FooterCol title="Guides" links={GUIDES.slice(0, 5).map((g) => [`/guides/${g.slug}`, g.shortTitle])} />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm text-ink-soft sm:px-6">
          <p>Made in New Zealand. Prices in NZD.</p>
          <div className="flex gap-5">
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-3 space-y-2">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-ink-soft hover:text-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
