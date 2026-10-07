import { qrSvg, type QrOptions } from "@/lib/qr";

/** Inline SVG QR code. Safe on the server and the client. */
export function QrCode({
  value,
  className,
  label,
  ...opts
}: QrOptions & { value: string; className?: string; label?: string }) {
  const svg = qrSvg(value, { ...opts, title: label ?? `QR code for ${value}` });
  return <div className={`[&>svg]:block [&>svg]:h-full [&>svg]:w-full ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}
