import { relations, sql } from "drizzle-orm";
import type { QrDesign } from "@/lib/qr-design";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

// ── Accounts ────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["seller", "admin"] }).notNull().default("seller"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the cookie token — the raw token never touches the database. */
    id: text("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

export const passwordResets = pgTable("password_resets", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ── Shops ───────────────────────────────────────────────────────────────────

export const shops = pgTable(
  "shops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subdomain: text("subdomain").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    description: text("description"),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),

    theme: text("theme").notNull().default("paper"),
    accentColor: text("accent_color"),

    contactEmail: text("contact_email"),
    showEmail: boolean("show_email").notNull().default(false),
    phone: text("phone"),
    location: text("location"),
    region: text("region"),
    marketInfo: text("market_info"),
    pickupInfo: text("pickup_info"),
    instagram: text("instagram"),
    facebook: text("facebook"),
    website: text("website"),

    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),

    /** Saved QR code design from the QR studio. Null until the seller changes it. */
    qrDesign: jsonb("qr_design").$type<QrDesign>(),

    // Where the seller's payouts go. Manual bank transfer details, or a Stripe
    // Connect account the seller verifies once (they never get a Stripe login).
    payoutAccountName: text("payout_account_name"),
    payoutAccountNumber: text("payout_account_number"),
    stripeAccountId: text("stripe_account_id"),
    stripePayoutsReady: boolean("stripe_payouts_ready").notNull().default(false),

    status: text("status", { enum: ["draft", "live", "suspended"] }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    setupPaidAt: timestamp("setup_paid_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("shops_subdomain_idx").on(t.subdomain),
    uniqueIndex("shops_owner_idx").on(t.ownerId),
  ],
);

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    priceCents: integer("price_cents").notNull(),
    /** Null means the item can't be shipped (pickup only). */
    shippingCents: integer("shipping_cents"),
    pickup: boolean("pickup").notNull().default(true),
    /** Null means unlimited / made to order. */
    quantity: integer("quantity").default(1),
    status: text("status", { enum: ["draft", "active", "sold", "hidden"] }).notNull().default("active"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("listings_shop_slug_idx").on(t.shopId, t.slug),
    index("listings_shop_status_idx").on(t.shopId, t.status),
  ],
);

export const listingImages = pgTable(
  "listing_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    width: integer("width"),
    height: integer("height"),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("listing_images_listing_idx").on(t.listingId, t.position)],
);

export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("enquiries_shop_idx").on(t.shopId, t.createdAt)],
);

/** Daily visit counters per shop, split by where the visitor came from (qr / web). */
export const shopVisits = pgTable(
  "shop_visits",
  {
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    day: date("day").notNull().default(sql`CURRENT_DATE`),
    source: text("source").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.shopId, t.day, t.source] })],
);

// ── Money ───────────────────────────────────────────────────────────────────

export type ShippingAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  postalCode?: string | null;
  region?: string | null;
  country?: string | null;
};

export const ORDER_STATUSES = ["pending", "paid", "shipped", "ready", "completed", "refunded", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** One purchase of one product, paid through Stripe Checkout on the platform account. */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").generatedAlwaysAsIdentity({ startWith: 1001 }).notNull(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    listingId: uuid("listing_id").references(() => listings.id, { onDelete: "set null" }),
    // Snapshot of what was bought, so history survives edits and deletions.
    itemTitle: text("item_title").notNull(),
    itemSlug: text("item_slug"),
    unitPriceCents: integer("unit_price_cents").notNull(),
    quantity: integer("quantity").notNull().default(1),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    platformFeeCents: integer("platform_fee_cents").notNull(),
    stripeFeeCents: integer("stripe_fee_cents"),
    refundedCents: integer("refunded_cents").notNull().default(0),
    delivery: text("delivery", { enum: ["post", "pickup"] }).notNull(),
    status: text("status", { enum: ORDER_STATUSES }).notNull().default("pending"),
    disputed: boolean("disputed").notNull().default(false),
    stockReserved: boolean("stock_reserved").notNull().default(false),

    buyerName: text("buyer_name"),
    buyerEmail: text("buyer_email"),
    buyerPhone: text("buyer_phone"),
    buyerNote: text("buyer_note"),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddress>(),

    courier: text("courier"),
    trackingNumber: text("tracking_number"),
    trackingUrl: text("tracking_url"),

    stripeSessionId: text("stripe_session_id"),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    /** Unguessable token for the buyer's order-tracking link. */
    publicToken: text("public_token").notNull(),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.number),
    uniqueIndex("orders_token_idx").on(t.publicToken),
    uniqueIndex("orders_session_idx").on(t.stripeSessionId),
    index("orders_shop_idx").on(t.shopId, t.createdAt),
    index("orders_pi_idx").on(t.stripePaymentIntentId),
  ],
);

export const LEDGER_TYPES = [
  "sale",
  "fee",
  "refund",
  "fee_refund",
  "dispute",
  "dispute_won",
  "payout",
  "payout_reversal",
  "adjustment",
] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

/**
 * Every movement of a seller's money. Balance = sum of amounts; an entry
 * counts towards the withdrawable balance once `available_at` has passed.
 * `ref` makes each entry idempotent, so webhook retries can't double-count.
 */
export const ledgerEntries = pgTable(
  "ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    payoutId: uuid("payout_id"),
    type: text("type", { enum: LEDGER_TYPES }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    availableAt: timestamp("available_at", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    ref: text("ref").notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("ledger_ref_idx").on(t.ref), index("ledger_shop_idx").on(t.shopId, t.availableAt)],
);

export const PAYOUT_STATUSES = ["requested", "processing", "paid", "rejected"] as const;
export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export const payouts = pgTable(
  "payouts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: integer("number").generatedAlwaysAsIdentity({ startWith: 501 }).notNull(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "cascade" }),
    amountCents: integer("amount_cents").notNull(),
    status: text("status", { enum: PAYOUT_STATUSES }).notNull().default("requested"),
    method: text("method", { enum: ["stripe", "manual"] }),
    // Bank details as they were when requested.
    accountName: text("account_name"),
    accountNumber: text("account_number"),
    stripeTransferId: text("stripe_transfer_id"),
    reference: text("reference"),
    note: text("note"),
    lastError: text("last_error"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("payouts_number_idx").on(t.number),
    index("payouts_shop_idx").on(t.shopId, t.requestedAt),
    index("payouts_status_idx").on(t.status),
    // One open request per shop at a time, enforced by the database.
    uniqueIndex("payouts_one_open_idx").on(t.shopId).where(sql`status in ('requested', 'processing')`),
  ],
);

/** Webhook events already handled, so Stripe retries are ignored. */
export const stripeEvents = pgTable("stripe_events", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  createdAt: createdAt(),
});

// ── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  shop: one(shops, { fields: [users.id], references: [shops.ownerId] }),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, { fields: [shops.ownerId], references: [users.id] }),
  listings: many(listings),
  enquiries: many(enquiries),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  shop: one(shops, { fields: [listings.shopId], references: [shops.id] }),
  images: many(listingImages),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));

export const enquiriesRelations = relations(enquiries, ({ one }) => ({
  shop: one(shops, { fields: [enquiries.shopId], references: [shops.id] }),
  listing: one(listings, { fields: [enquiries.listingId], references: [listings.id] }),
}));

export type User = typeof users.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type ListingImage = typeof listingImages.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type Payout = typeof payouts.$inferSelect;
