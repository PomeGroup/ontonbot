CREATE TYPE campaign_type AS ENUM (
    'onion1'
    );
ALTER TABLE "token_campaign_nft_collections"
    ADD COLUMN "campaign_type" "campaign_type" NOT NULL DEFAULT 'onion1';
ALTER TABLE "token_campaign_spin_packages"
    ADD COLUMN "campaign_type" "campaign_type" NOT NULL DEFAULT 'onion1';