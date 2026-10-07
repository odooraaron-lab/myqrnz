import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-start justify-center px-4 py-20">
      <Logo />
      <h1 className="font-wide mt-10 text-4xl">This page isn&apos;t here.</h1>
      <p className="mt-4 text-lg text-ink-soft">The link may be old, or the address may have a typo.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn btn-primary">
          Go to the home page
        </Link>
        <Link href="/guides" className="btn btn-outline">
          Read the guides
        </Link>
      </div>
    </main>
  );
}
