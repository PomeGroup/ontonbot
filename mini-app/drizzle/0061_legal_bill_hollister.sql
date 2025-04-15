DO $$ BEGIN
 CREATE TYPE "public"."play2win_campaign_type" AS ENUM('genesis_onion');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "play2win_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"campaign_type" "play2win_campaign_type" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "play2win_campaigns_user_campaign_idx" ON "play2win_campaigns" USING btree ("user_id","campaign_type");