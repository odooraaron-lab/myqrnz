import { QrCode } from "@/components/QrCode";

/**
 * The printed sign a seller props up on their stall. Used as the hero visual
 * and mirrors the real A4 print template.
 */
export function StallSign({
  name,
  address,
  qrValue,
  sticker = true,
  className = "",
}: {
  name: string;
  address: string;
  qrValue: string;
  sticker?: boolean;
  className?: string;
}) {
  return (
    <figure className={`relative mx-auto w-full max-w-[360px] ${className}`}>
      <div className="relative -rotate-[1.5deg] border-[1.5px] border-ink bg-card px-7 pb-7 pt-8 shadow-[0_1px_0_var(--color-line),0_18px_40px_-18px_rgb(25_28_58/0.35)]">
        <p className="text-[0.9375rem] font-medium text-ink-soft">Scan to shop online</p>
        <p
          className="font-wide mt-2 line-clamp-2 break-words text-[clamp(1.6rem,4.5vw,2.1rem)] leading-[1.02] text-ink"
          aria-live="polite"
        >
          {name || "Your shop"}
        </p>
        <div className="mt-5 aspect-square w-full">
          <QrCode value={qrValue} fg="#191c3a" margin={1} className="h-full w-full" label={`QR code linking to ${address}`} />
        </div>
        <p className="font-narrow mt-4 truncate text-center text-[1.05rem] font-semibold tracking-tight text-ink">{address}</p>
        <p className="mt-1 text-center text-sm text-ink-soft">Order for pickup or delivery</p>
      </div>
      {sticker && (
        <div
          aria-hidden="true"
          className="absolute -right-3 -top-5 flex h-[5.5rem] w-[5.5rem] rotate-[9deg] flex-col items-center justify-center rounded-full bg-sticker text-center text-ink shadow-[0_2px_0_rgb(25_28_58/0.18)] sm:-right-6"
        >
          <span className="font-wide text-[1.6rem] leading-none">$0</span>
          <span className="mt-0.5 text-[0.75rem] font-semibold leading-tight">a month</span>
        </div>
      )}
      <figcaption className="sr-only">Example printed stall sign with a QR code for {address}</figcaption>
    </figure>
  );
}
