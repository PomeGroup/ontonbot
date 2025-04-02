DO
$$
    BEGIN
        CREATE TYPE "public"."campaign_type" AS ENUM ('onion1');
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint
ALTER TABLE "token_campaign_nft_collections"
    ADD COLUMN "probability_weight" bigint NOT NULL DEFAULT 1;
ALTER TABLE "token_campaign_orders"
    ADD COLUMN "wallet_address" varchar(255);--> statement-breakpoint
ALTER TABLE "token_campaign_orders"
    ADD COLUMN "state" "order_state" DEFAULT 'new' NOT NULL;