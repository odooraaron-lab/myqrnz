"use client";

import { useRef, useState } from "react";

type Img = { url: string; alt: string | null; width: number | null; height: number | null };

/** Swipe on phones, thumbnails on larger screens. */
export function Gallery({ images, title }: { images: Img[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const strip = useRef<HTMLDivElement>(null);

  if (images.length === 0) {
    return <div className="s-muted grid aspect-square place-items-center" style={{ background: "var(--s-line)" }}>No photo</div>;
  }

  const go = (i: number) => {
    setCurrent(i);
    const el = strip.current?.children[i] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <div>
      <div
        ref={strip}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ borderRadius: "var(--s-radius)" }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== current) setCurrent(i);
        }}
        aria-label={`${title} photos`}
      >
        {images.map((img, i) => (
          <div key={img.url} className="aspect-square w-full shrink-0 snap-start" style={{ background: "var(--s-line)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.alt ? `${img.alt}${images.length > 1 ? `, photo ${i + 1}` : ""}` : title}
              width={img.width ?? undefined}
              height={img.height ?? undefined}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : undefined}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === current}
              className="h-16 w-16 shrink-0 overflow-hidden border-2"
              style={{ borderColor: i === current ? "var(--s-accent)" : "transparent", borderRadius: "var(--s-radius)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
