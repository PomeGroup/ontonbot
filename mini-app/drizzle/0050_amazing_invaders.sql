ALTER TABLE "token_campaign_nft_collections" ADD COLUMN "sorting" bigint DEFAULT 0;--> statement-breakpoint
ALTER TABLE "token_campaign_nft_collections" ADD COLUMN "is_for_sale" boolean DEFAULT false;