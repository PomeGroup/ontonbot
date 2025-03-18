ALTER TABLE "game_leaderboard" ADD COLUMN "reward_created" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game_leaderboard" ADD COLUMN "notification_received" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "game_leaderboard" ADD COLUMN "has_claimed" boolean DEFAULT false;