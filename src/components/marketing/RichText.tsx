import Link from "next/link";
import { Fragment } from "react";
import type { Block } from "@/content/guides";

/** Turns "see [pricing](/pricing)" into text with a link. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!m) return <Fragment key={i}>{part}</Fragment>;
        const [, label, href] = m;
        return href.startsWith("/") ? (
          <Link key={i} href={href}>
            {label}
          </Link>
        ) : (
          <a key={i} href={href} rel="noopener">
            {label}
          </a>
        );
      })}
    </>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return <h2 key={i}>{b.text}</h2>;
          case "h3":
            return <h3 key={i}>{b.text}</h3>;
          case "p":
            return (
              <p key={i}>
                <Inline text={b.text} />
              </p>
            );
          case "ul":
            return (
              <ul key={i}>
                {b.items.map((it) => (
                  <li key={it}>
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i}>
                {b.items.map((it) => (
                  <li key={it}>
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            );
          case "tip":
            return (
              <aside key={i} className="my-8 border-l-[3px] border-sticker bg-card px-5 py-4 text-[1rem]">
                <p className="!m-0">
                  <strong>Tip: </strong>
                  <Inline text={b.text} />
                </p>
              </aside>
            );
        }
      })}
    </>
  );
}
