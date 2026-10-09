CREATE TABLE "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"order_id" uuid,
	"payout_id" uuid,
	"type" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"available_at" timestamp with time zone NOT NULL,
	"description" text NOT NULL,
	"ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "orders_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1001 CACHE 1),
	"shop_id" uuid NOT NULL,
	"listing_id" uuid,
	"item_title" text NOT NULL,
	"item_slug" text,
	"unit_price_cents" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"shipping_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"platform_fee_cents" integer NOT NULL,
	"stripe_fee_cents" integer,
	"refunded_cents" integer DEFAULT 0 NOT NULL,
	"delivery" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"disputed" boolean DEFAULT false NOT NULL,
	"stock_reserved" boolean DEFAULT false NOT NULL,
	"buyer_name" text,
	"buyer_email" text,
	"buyer_phone" text,
	"buyer_note" text,
	"shipping_address" jsonb,
	"courier" text,
	"tracking_number" text,
	"tracking_url" text,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"public_token" text NOT NULL,
	"paid_at" timestamp with time zone,
	"shipped_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer GENERATED ALWAYS AS IDENTITY (sequence name "payouts_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 501 CACHE 1),
	"shop_id" uuid NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"method" text,
	"account_name" text,
	"account_number" text,
	"stripe_transfer_id" text,
	"reference" text,
	"note" text,
	"last_error" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "payout_account_name" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "payout_account_number" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "stripe_payouts_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ledger_ref_idx" ON "ledger_entries" USING btree ("ref");--> statement-breakpoint
CREATE INDEX "ledger_shop_idx" ON "ledger_entries" USING btree ("shop_id","available_at");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_idx" ON "orders" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_token_idx" ON "orders" USING btree ("public_token");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_session_idx" ON "orders" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "orders_shop_idx" ON "orders" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "orders_pi_idx" ON "orders" USING btree ("stripe_payment_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_number_idx" ON "payouts" USING btree ("number");--> statement-breakpoint
CREATE INDEX "payouts_shop_idx" ON "payouts" USING btree ("shop_id","requested_at");--> statement-breakpoint
CREATE INDEX "payouts_status_idx" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payouts_one_open_idx" ON "payouts" USING btree ("shop_id") WHERE status in ('requested', 'processing');