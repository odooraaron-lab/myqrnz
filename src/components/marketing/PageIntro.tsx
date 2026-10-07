import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/config/site";

type Crumb = { href: string; label: string };

export function PageIntro({
  title,
  intro,
  crumbs = [],
  children,
}: {
  title: string;
  intro?: string;
  crumbs?: Crumb[];
  children?: React.ReactNode;
}) {
  const trail = [{ href: "/", label: "Home" }, ...crumbs];
  return (
    <header className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16">
      {crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-soft">
          <ol className="flex flex-wrap gap-x-2">
            {trail.map((c, i) => (
              <li key={c.href} className="flex gap-2">
                {i > 0 && <span aria-hidden="true">/</span>}
                {i === trail.length - 1 ? (
                  <span aria-current="page" className="text-ink">
                    {c.label}
                  </span>
                ) : (
                  <Link href={c.href} className="hover:text-ink">
                    {c.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <h1 className="font-wide max-w-4xl text-[clamp(2.1rem,5.2vw,3.6rem)]">{title}</h1>
      {intro && <p className="mt-6 max-w-[60ch] text-lg leading-relaxed text-ink-soft">{intro}</p>}
      {children}
      {crumbs.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: trail.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: c.label,
              item: `${site.url}${c.href === "/" ? "" : c.href}`,
            })),
          }}
        />
      )}
    </header>
  );
}

export function CtaBand({ title, body }: { title: string; body?: string }) {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 border-[1.5px] border-ink bg-card p-8 sm:p-10 md:flex-row md:items-center">
        <div>
          <h2 className="font-semiwide text-2xl sm:text-3xl">{title}</h2>
          {body && <p className="mt-2 max-w-[56ch] text-ink-soft">{body}</p>}
        </div>
        <Link href="/register" className="btn btn-primary shrink-0">
          Start your shop
        </Link>
      </div>
    </section>
  );
}
