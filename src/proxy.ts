import { NextResponse, type NextRequest } from "next/server";

/**
 * Host-based routing.
 *
 *   myqr.co.nz/...          → marketing site, accounts, dashboard
 *   www.myqr.co.nz/...      → redirect to the apex domain
 *   anna.myqr.co.nz/...     → rewritten to /s/anna/... (Anna's storefront)
 *
 * The storefront also answers at myqr.co.nz/s/anna for owner previews and
 * Vercel preview deployments; those copies are marked noindex.
 */

const ROOT = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000").toLowerCase();
const ROOT_HOSTNAME = ROOT.split(":")[0];

// Paths that only make sense on the main domain.
const ROOT_ONLY = /^\/(dashboard|login|register|forgot-password|reset-password|admin|logout)(\/|$)/;
// Static assets that should never be rewritten into a shop.
const STATIC_FILE = /\.(?:svg|png|jpe?g|webp|gif|ico|css|js|map|woff2?|ttf|webmanifest)$/i;

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = (request.headers.get("host") || "").toLowerCase().split(":")[0];
  const { pathname, search } = url;

  const headers = new Headers(request.headers);
  headers.delete("x-myqr-shop");
  headers.delete("x-myqr-shop-base");

  if (hostname === `www.${ROOT_HOSTNAME}`) {
    const target = new URL(request.url);
    target.host = ROOT;
    return NextResponse.redirect(target, 308);
  }

  const isShopHost = hostname !== ROOT_HOSTNAME && hostname.endsWith(`.${ROOT_HOSTNAME}`);

  if (isShopHost) {
    const sub = hostname.slice(0, -(ROOT_HOSTNAME.length + 1));

    if (ROOT_ONLY.test(pathname)) {
      const target = new URL(request.url);
      target.host = ROOT;
      return NextResponse.redirect(target);
    }

    if (pathname.startsWith("/api/") || (STATIC_FILE.test(pathname) && !pathname.endsWith("sitemap.xml"))) {
      return NextResponse.next({ request: { headers } });
    }

    // Shop names are a single DNS label; anything else is not a shop.
    const safeSub = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(sub) ? sub : "_invalid";
    headers.set("x-myqr-shop", safeSub);
    headers.set("x-myqr-shop-base", "");
    const rewritten = new URL(`/s/${safeSub}${pathname === "/" ? "" : pathname}${search}`, request.url);
    return NextResponse.rewrite(rewritten, { request: { headers } });
  }

  // Main domain: tag direct storefront previews so links inside them keep the prefix.
  const preview = pathname.match(/^\/s\/([a-z0-9-]+)/);
  if (preview) {
    headers.set("x-myqr-shop", preview[1]);
    headers.set("x-myqr-shop-base", `/s/${preview[1]}`);
  }

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads/|favicon.ico).*)"],
};
