ALTER TABLE "token_campaign_orders" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "token_campaign_spin_packages" ALTER COLUMN "price" SET DEFAULT '100.00';--> statement-breakpoint
ALTER TABLE "token_campaign_spin_packages" ALTER COLUMN "price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "token_campaign_nft_collections" ADD COLUMN "sales_volume" bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "token_campaign_nft_collections" ADD COLUMN "sales_count" bigint DEFAULT 0;