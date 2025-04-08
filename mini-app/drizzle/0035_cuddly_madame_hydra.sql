CREATE TABLE IF NOT EXISTS "token_campaign_nft_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"description" varchar(500),
	"image" varchar(255),
	"social_links" varchar(255),
	"address" varchar(255),
	"metadata_url" varchar(255),
	"item_meta_data" jsonb,
	"last_registered_item_index" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_campaign_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"spin_package_id" bigint NOT NULL,
	"final_price" numeric(10, 2) NOT NULL,
	"default_price" numeric(10, 2) NOT NULL,
	"payment_type" "payment_types" NOT NULL,
	"affiliate_hash" varchar(255),
	"coupon_id" bigint,
	"trx_hash" varchar(255),
	"user_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_campaign_spin_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"sold_items_count" bigint DEFAULT 0 NOT NULL,
	"auto_activation_date" bigint,
	"price" numeric(10, 2),
	"payment_type" "payment_types" NOT NULL,
	"auto_deactivation_date" bigint,
	"spin_count" integer DEFAULT 0 NOT NULL,
	"is_for_sale" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_campaign_user_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"collection_id" bigint NOT NULL,
	"method" varchar(255),
	"method_detail_id" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "token_campaign_user_spins" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"spin_package_id" bigint,
	"spin_index" bigint,
	"nft_collection_id" bigint,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3),
	"updated_by" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "token_campaign_orders" ADD CONSTRAINT "token_campaign_orders_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "token_campaign_user_collections" ADD CONSTRAINT "token_campaign_user_collections_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "token_campaign_user_spins" ADD CONSTRAINT "token_campaign_user_spins_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "address_idx" ON "token_campaign_nft_collections" USING btree ("address");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "name_idx" ON "token_campaign_nft_collections" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "last_registered_item_index_idx" ON "token_campaign_nft_collections" USING btree ("last_registered_item_index");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spin_package_id_idx" ON "token_campaign_orders" USING btree ("spin_package_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_id_idx" ON "token_campaign_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trx_hash_idx" ON "token_campaign_orders" USING btree ("trx_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcps_name_idx" ON "token_campaign_spin_packages" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcps_active_idx" ON "token_campaign_spin_packages" USING btree ("active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcps_auto_activation_date_idx" ON "token_campaign_spin_packages" USING btree ("auto_activation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcps_auto_deactivation_date_idx" ON "token_campaign_spin_packages" USING btree ("auto_deactivation_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcps_is_for_sale_idx" ON "token_campaign_spin_packages" USING btree ("is_for_sale");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcuc_user_id_idx" ON "token_campaign_user_collections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcuc_collection_id_idx" ON "token_campaign_user_collections" USING btree ("collection_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcus_user_id_idx" ON "token_campaign_user_spins" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcus_spin_package_id_idx" ON "token_campaign_user_spins" USING btree ("spin_package_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tcus_nft_collection_id_idx" ON "token_campaign_user_spins" USING btree ("nft_collection_id");