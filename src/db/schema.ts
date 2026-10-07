import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
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
