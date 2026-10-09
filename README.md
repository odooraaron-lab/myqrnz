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
| Orders | `src/lib/orders.ts`, `src/app/dashboard/orders`, `src/app/s/[shop]/order` | Buy now on product pages (Stripe Checkout on your account), stock held during checkout, seller order tracking (send / ready / collected / refund), buyer tracking page and emails |
| Balances & payouts | `src/lib/money.ts`, `src/lib/payouts.ts`, `src/app/dashboard/balance`, `src/app/admin/payouts` | Per-seller ledger with fees, hold period, statement and running balance; payout requests; admin pays by Stripe Connect transfer or bank transfer |
| Setup fee | `src/lib/payments.ts` | "Pay $49 and publish" checkout; the webhook publishes the shop |

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

## Payments, balances and payouts

How the money moves:

1. **Customer pays you.** "Buy now" opens Stripe Checkout on your Stripe account. The item is held for 30 minutes while they pay.
2. **The webhook records the sale** (`/api/stripe/webhook`): the order is marked paid, both parties are emailed, and the seller's ledger gets the sale (+) and the myQR fee (−). Both are held for `PAYOUT_HOLD_DAYS` (default 7).
3. **Seller's balance**: *available* (past the hold), *on hold*, and *paid out*, with a statement showing every sale, fee, refund, dispute and withdrawal and the running balance. Refunds and card disputes come straight off the balance; the fee on a refunded amount is returned.
4. **Seller requests a payout** (minimum `PAYOUT_MINIMUM`, one open request at a time; enforced in the database).
5. **You process it at `/admin/payouts`**:
   - **Send with Stripe** (`STRIPE_CONNECT_ENABLED=true`): a Stripe transfer to the seller's connected account; Stripe pays their bank. Sellers verify once from their Balance page. Their account has no Stripe dashboard or login and you carry Stripe's fees and losses, so to them it's just "verify your bank account".
   - **Mark paid**: you paid them by internet banking; record the reference.
   - **Return**: declines the request and puts the money back in their balance.

Every webhook handler is idempotent (ledger entries have unique refs), so Stripe retries can't double-count.

### Turning it on

1. In Stripe (test mode first), copy the secret key into `STRIPE_SECRET_KEY`.
2. Developers → Webhooks → add endpoint `https://myqr.co.nz/api/stripe/webhook` with events `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`, `charge.refund.updated`, `charge.dispute.created`, `charge.dispute.closed`. Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
3. For Stripe payouts: enable Connect (Settings → Connect, platform/marketplace, New Zealand), then add a second endpoint at the same URL listening to **connected accounts** for `account.updated`, with its secret in `STRIPE_CONNECT_WEBHOOK_SECRET`. Set `STRIPE_CONNECT_ENABLED=true`.
4. Set `PAYMENTS_ENABLED=true` and redeploy.

Locally: `stripe listen --forward-to localhost:3000/api/stripe/webhook` and use its `whsec_…` secret.

**Fees.** `platformFeePercent` and `platformFeeFixedCents` in `src/config/site.ts`. Stripe charges NZ cards about 2.65% + 30c out of your share, and the admin page shows your actual margin after Stripe fees.

**Why Connect.** Stripe's terms restrict marketplaces that collect payments for other sellers and pay them out without Connect (see Stripe's "aggregation" guidance). Bank-transfer mode works, but Connect is the supported route.

## Project layout

```
src/
  proxy.ts                 host → storefront rewrite
  config/site.ts           domain, prices, fees
  db/                      Drizzle schema + client
  lib/                     auth, qr, themes, seo, storage, email, stripe, orders, money, payouts
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
