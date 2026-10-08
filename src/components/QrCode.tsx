import { qrSvg, type RenderOptions } from "@/lib/qr";

/**
 * Inline SVG QR code. Works on the server and the client. Inline SVG has no
 * "save image" menu, and preview codes carry a watermark and point to myQR.
 */
export function QrCode({
  value,
  className,
  label,
  ...opts
}: RenderOptions & { value: string; className?: string; label?: string }) {
  const svg = qrSvg(value, { ...opts, title: label ?? (opts.watermark ? "Preview QR code" : `QR code for ${value}`) });
  return (
    <div
      className={`select-none [-webkit-touch-callout:none] [&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
