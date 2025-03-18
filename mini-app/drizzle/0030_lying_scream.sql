CREATE TABLE IF NOT EXISTS "game_leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"host_user_id" text NOT NULL,
	"telegram_user_id" bigint NOT NULL,
	"tournament_id" integer NOT NULL,
	"game_id" integer NOT NULL,
	"host_tournament_id" text NOT NULL,
	"nickname" text,
	"match_id" uuid,
	"position" integer,
	"points" integer,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "tournaments" ADD COLUMN "reward_link" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "game_leaderboard" ADD CONSTRAINT "game_leaderboard_telegram_user_id_users_user_id_fk" FOREIGN KEY ("telegram_user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "game_leaderboard" ADD CONSTRAINT "game_leaderboard_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "game_leaderboard" ADD CONSTRAINT "game_leaderboard_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gl_host_tournament_idx" ON "game_leaderboard" USING btree ("host_tournament_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "gl_telegram_user_idx" ON "game_leaderboard" USING btree ("telegram_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_user_tournament" ON "game_leaderboard" USING btree ("host_tournament_id","telegram_user_id");