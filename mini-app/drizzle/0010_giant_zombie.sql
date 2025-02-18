CREATE TYPE ton_society_status_enum AS ENUM (
    'NOT_CLAIMED',
    'CLAIMED',
    'NOT_ELIGIBLE',
    'RECEIVED'
    );

ALTER TABLE "rewards"
    ADD COLUMN "ton_society_status" "ton_society_status_enum" DEFAULT 'NOT_CLAIMED' NOT NULL;