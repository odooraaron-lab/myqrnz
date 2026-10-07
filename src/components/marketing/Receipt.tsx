import { site } from "@/config/site";

/** Pricing told the way a market sale is: as an itemised receipt. */
export function Receipt({ className = "" }: { className?: string }) {
  const lines: [string, string][] = [
    ["Your own web address", "Included"],
    ["Shop designs and logo", "Included"],
    ["Unlimited products", "Included"],
    ["Printable QR signs and cards", "Included"],
    ["A QR code for every product", "Included"],
    ["Google-ready pages", "Included"],
    ["Monthly fee", "$0.00"],
  ];
  return (
    <div
      className={`relative mx-auto w-full max-w-[380px] bg-card px-7 pb-9 pt-7 text-ink shadow-[0_18px_40px_-20px_rgb(25_28_58/0.35)] ${className}`}
      style={{
        // Torn bottom edge.
        maskImage:
          "linear-gradient(#000 0 0), radial-gradient(circle at 8px 100%, transparent 7px, #000 7.5px)",
        maskSize: "100% calc(100% - 8px), 16px 9px",
        maskPosition: "top, bottom",
        maskRepeat: "no-repeat, repeat-x",
      }}
    >
      <p className="font-wide text-center text-xl">myQR</p>
      <p className="font-narrow mt-1 text-center text-sm text-ink-soft">One shop, set up once</p>
      <div className="my-5 border-t border-dashed border-line-strong" />
      <dl className="font-narrow space-y-2.5 text-[0.98rem]">
        {lines.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-2">
            <dt>{label}</dt>
            <span aria-hidden="true" className="flex-1 translate-y-[-3px] border-b border-dotted border-line-strong" />
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="my-5 border-t border-dashed border-line-strong" />
      <dl className="font-narrow space-y-2 text-[0.98rem]">
        <div className="flex items-baseline justify-between">
          <dt className="text-lg font-bold">Setup, paid once</dt>
          <dd className="font-wide text-3xl">${site.setupFee}</dd>
        </div>
        <div className="flex items-baseline justify-between text-ink-soft">
          <dt>Per sale, once checkout is on</dt>
          <dd className="font-semibold text-ink">{site.platformFeePercent}%</dd>
        </div>
      </dl>
      <p className="font-narrow mt-6 text-center text-sm text-ink-soft">Prices in NZD. Thank you for shopping small.</p>
    </div>
  );
}
