# myQR — myqr.co.nz

Online stores with printable QR codes for market stalls and small shops in New Zealand.

A seller signs up at **myqr.co.nz**, picks a shop name and an address (`anna` → **anna.myqr.co.nz**), builds their shop from a dashboard, lists products, and prints a QR code for their stall that opens the shop. One-off setup fee, no monthly fees, a percentage per sale once payments are on.

## What's built

| Area | Where | What it does |
| --- | --- | --- |
| Marketing site | `src/app/(marketing)` | Home with live name-claim demo, how it works, pricing, market stalls, small shops, FAQ, 7 SEO guides, terms, privacy, sitemap, robots, share image |
| Accounts | `src/app/(auth)` | Register (shop name, address, email, password), log in/out, password reset by email |
| Dashboard | `src/app/dashboard` | Overview + checklist + stats, shop design (themes, logo, cover, contact, SEO), products, QR studio, enquiries inbox, account |
| Storefronts | `src/app/s/[shop]` | Each shop at `<name>.myqr.co.nz`: home, product pages, order requests, per-shop SEO, sitemap, robots, share card |
| QR codes | `src/lib/qr.ts`, `src/lib/qr-design.ts`, `src/app/dashboard/qr`, `src/app/print` | 8 patterns, 5 corner frames × 5 corner centres, solid/gradient/radial colour, corner colour, light backgrounds, 6 frames with custom words, centre logo, 9 ready-made looks; saved per shop; PNG/SVG downloads and A4 print sheets |
| Preview mode | `src/lib/payments.ts` (`qrUnlocked`), `src/app/(marketing)/preview` | Until a shop is live (and paid, once payments are on) every code is a watermarked preview that opens a myQR preview page, not the shop. Downloads and printing unlock on publish |
| Platform admin | `src/app/admin` | All shops, search, suspend/restore, weekly numbers. Access via `ADMIN_EMAILS` |
| Payments | `src/lib/payments.ts` | **Not wired up yet** — the single place Stripe goes (see below) |

### How subdomains work

`src/proxy.ts` (Next 16's replacement for middleware) looks at the host:

- `myqr.co.nz` → marketing site, accounts, dashboard
- `www.myqr.co.nz` → redirects to `myqr.co.nz`
- `anna.myqr.co.nz/...` → rewritten internally to `/s/anna/...`

Owners preview an unpublished shop at `myqr.co.nz/s/anna` (only they can see it; it's marked noindex). Unclaimed addresses show a "this name is available" page that links to sign-up.

## Stack

Next.js 16 (App Router, server actions) · React 19 · Tailwind CSS 4 · Drizzle ORM · Neon Postgres · Vercel Blob · Resend · `qrcode`. Fonts are self-hosted from npm (Archivo, Newsreader, Bodoni Moda, Manrope).

## Deploying on Vercel

1. **Import the repo** into Vercel as a Next.js project.
2. **Database** — Storage → add Neon. It sets `DATABASE_URL`. Migrations in `./drizzle` run automatically before each build (`npm run build`).
3. **Photo storage** — Storage → add a Blob store. It sets `BLOB_READ_WRITE_TOKEN`.
4. **Email** — in Resend, verify `myqr.co.nz` (add the DNS records it gives you), then set `RESEND_API_KEY` and `EMAIL_FROM="myQR <hello@myqr.co.nz>"`.
5. **Environment variables** — set `NEXT_PUBLIC_ROOT_DOMAIN=myqr.co.nz`, `ADMIN_EMAILS=<your email>`, `PAYMENTS_ENABLED=false`. See `.env.example`.
6. **Domains** — in Project → Settings → Domains add **both** `myqr.co.nz` and `*.myqr.co.nz`.
   Wildcard domains need Vercel to manage DNS: point the domain's nameservers at Vercel
   (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) at your .nz registrar. Vercel then issues certificates for every shop subdomain automatically. Add `www.myqr.co.nz` too; the app redirects it to the apex.
7. Register with the email in `ADMIN_EMAILS` to get `/admin`.

## Running locally

```bash
npm install
cp .env.example .env.local      # then edit it
# NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
# DATABASE_URL=postgres://... (any Postgres; Neon works too)
npm run db:migrate
npm run dev
```

- Main site: http://localhost:3000
- A shop: http://anna.localhost:3000 (browsers resolve `*.localhost` to your machine)
- Without `BLOB_READ_WRITE_TOKEN`, uploads are saved to `.data/uploads`.
- Without `RESEND_API_KEY`, emails are printed in the terminal.

Change the schema in `src/db/schema.ts`, then run `npm run db:generate` to create a migration.

## Prices and fees

Set in `src/config/site.ts` (`setupFee`, `platformFeePercent`). They're placeholders ($49 and 3%) — the marketing pages, structured data, dashboard and receipt graphic all read from there.

## Adding Stripe later

Everything money-related routes through `src/lib/payments.ts`:

1. **Setup fee** — implement `startSetupCheckout()` to create a Stripe Checkout Session and return its URL. Add a webhook route for `checkout.session.completed` that sets `shops.setup_paid_at` and `status = 'live'`. Then set `PAYMENTS_ENABLED=true`; the dashboard's publish button already switches to "Pay $49 and publish".
2. **Seller payouts** — Stripe Connect (Express). Store each shop's connected account id, onboard from the dashboard, and create product checkouts as destination charges with `application_fee_amount = price × platformFeePercent`.
3. **Checkout** — product pages currently send an order request (saved to the seller's inbox and emailed). Swap the "Order this item" button for a checkout when payments are on.

## Project layout

```
src/
  proxy.ts                 host → storefront rewrite
  config/site.ts           domain, prices, fees
  db/                      Drizzle schema + client
  lib/                     auth, qr, themes, seo, storage, email, payments
  content/                 guides and FAQ copy
  components/              shared UI (marketing, dashboard, storefront)
  app/(marketing)          public site
  app/(auth)               sign up / log in
  app/dashboard            seller dashboard
  app/print/[template]     print-ready QR sheets
  app/s/[shop]             storefronts
  app/admin                platform admin
drizzle/                   SQL migrations
```
