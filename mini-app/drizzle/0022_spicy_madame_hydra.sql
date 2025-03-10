CREATE TYPE "tournament_state" AS ENUM (
    'Active',
    'Concluded',
    'TonAddressPending'
    );

CREATE TYPE "tournament_entry_type" AS ENUM (
    'Tickets',
    'Pass'
    );

CREATE TYPE "prize_pool_status" AS ENUM (
    'Undefined',
    'BuildingUp',
    'Ready',
    'Settled'
    );

CREATE TYPE "prize_type" AS ENUM (
    'None',
    'Coin'
    );

CREATE TABLE IF NOT EXISTS "games"
(
    "id"            serial PRIMARY KEY NOT NULL,
    "host_game_id"  uuid               NOT NULL,
    "name"          text,
    "image_url"     text,
    "raw_game_json" json,
    "created_at"    timestamp DEFAULT now(),
    "updated_at"    timestamp(3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tournaments"
(
    "id"                     serial PRIMARY KEY NOT NULL,
    "host_tournament_id"     text               NOT NULL,
    "host_tournament_guid"   uuid,
    "game_id"                integer            NOT NULL,
    "created_by_user_id"     bigint             NOT NULL,
    "owner"                  bigint,
    "name"                   text,
    "image_url"              text,
    "state"                  "tournament_state",
    "create_date"            timestamp,
    "start_date"             timestamp,
    "end_date"               timestamp,
    "players_count"          integer   DEFAULT 0,
    "entry_fee"              bigint,
    "ton_entry_type"         "tournament_entry_type",
    "ton_tournament_address" text,
    "prize_pool_status"      "prize_pool_status",
    "prize_type"             "prize_type",
    "current_prize_pool"     bigint,
    "activity_id"            integer,
    "ts_reward_image"        text,
    "ts_reward_video"        text,
    "hidden"                 boolean   DEFAULT false,
    "raw_host_json"          json,
    "created_at"             timestamp DEFAULT now(),
    "updated_at"             timestamp(3)
);
--> statement-breakpoint
DO
$$
    BEGIN
        ALTER TABLE "tournaments"
            ADD CONSTRAINT "tournaments_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games" ("id") ON DELETE no action ON UPDATE no action;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint
DO
$$
    BEGIN
        ALTER TABLE "tournaments"
            ADD CONSTRAINT "tournaments_created_by_user_id_users_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users" ("user_id") ON DELETE no action ON UPDATE no action;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint
DO
$$
    BEGIN
        ALTER TABLE "tournaments"
            ADD CONSTRAINT "tournaments_owner_users_user_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users" ("user_id") ON DELETE no action ON UPDATE no action;
    EXCEPTION
        WHEN duplicate_object THEN null;
    END
$$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "games_host_game_id_unique" ON "games" USING btree ("host_game_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "games_name_idx" ON "games" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tournaments_host_tournament_id_unique" ON "tournaments" USING btree ("host_tournament_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tournaments_game_id_idx" ON "tournaments" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tournaments_created_by_user_id_idx" ON "tournaments" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tournaments_owner_idx" ON "tournaments" USING btree ("owner");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tournaments_state_idx" ON "tournaments" USING btree ("state");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tournaments_activity_id_idx" ON "tournaments" USING btree ("activity_id");