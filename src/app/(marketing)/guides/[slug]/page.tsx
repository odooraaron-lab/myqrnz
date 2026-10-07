import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { CtaBand, PageIntro } from "@/components/marketing/PageIntro";
import { Blocks } from "@/components/marketing/RichText";
import { site } from "@/config/site";
import { GUIDES, getGuide } from "@/content/guides";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.description,
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <PageIntro
        title={guide.title}
        crumbs={[
          { href: "/guides", label: "Guides" },
          { href: `/guides/${guide.slug}`, label: guide.shortTitle },
        ]}
      >
        <p className="mt-5 text-sm text-ink-soft">
          Updated {formatDate(guide.updated)}, {guide.readMinutes} min read
        </p>
      </PageIntro>

      <div className="mx-auto grid max-w-6xl gap-14 px-4 sm:px-6 lg:grid-cols-[1fr_17rem]">
        <article className="prose-guide">
          <p className="text-xl leading-relaxed text-ink">{guide.intro}</p>
          <Blocks blocks={guide.body} />
        </article>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="panel p-6">
            <p className="font-bold">Start your own shop</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Your name, your products, your QR code. ${site.setupFee} once, no monthly fees.
            </p>
            <Link href="/register" className="btn btn-primary btn-sm mt-4 w-full">
              Claim your name
            </Link>
          </div>
          <nav aria-label="More guides" className="mt-8">
            <p className="text-sm font-semibold">More guides</p>
            <ul className="mt-3 space-y-3">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link href={`/guides/${g.slug}`} className="text-[0.9375rem] leading-snug text-ink-soft hover:text-ink">
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
      </div>

      <CtaBand title="Turn this into sales" body="Set up your shop and print your QR code today." />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.description,
          datePublished: guide.published,
          dateModified: guide.updated,
          inLanguage: "en-NZ",
          mainEntityOfPage: `${site.url}/guides/${guide.slug}`,
          author: { "@type": "Organization", name: site.name, url: site.url },
          publisher: { "@type": "Organization", name: site.name, logo: { "@type": "ImageObject", url: `${site.url}/icon.svg` } },
        }}
      />
    </>
  );
}
