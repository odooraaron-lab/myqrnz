import Link from "next/link";

/** The finder-pattern mark: the one shape every QR code shares. */
export function LogoMark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 7 7" aria-hidden="true" className={className}>
      <path d="M0 0h7v7H0zM1 1v5h5V1z" fill="currentColor" fillRule="evenodd" />
      <path d="M2 2h3v3H2z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ href = "/", className = "" }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={`inline-flex items-center gap-2 text-ink ${className}`} aria-label="myQR home">
      <LogoMark className="text-cobalt" />
      <span className="text-[1.3rem] leading-none tracking-tight">
        <span className="font-medium">my</span>
        <span className="font-wide text-[1.15rem]">QR</span>
      </span>
    </Link>
  );
}
