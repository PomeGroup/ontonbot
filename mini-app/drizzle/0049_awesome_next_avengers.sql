DO $$ BEGIN
 CREATE TYPE "public"."spin_type" AS ENUM('normal', 'specific_reward', 'rewarded_spin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "token_campaign_user_spins" ADD COLUMN "spin_type" "spin_type" DEFAULT 'normal';