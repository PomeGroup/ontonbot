DO $$ BEGIN
 CREATE TYPE "public"."raffle_result_status" AS ENUM('pending', 'eligible', 'paid', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."raffle_status" AS ENUM('waiting_funding', 'funded', 'distributing', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_raffle_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"raffle_id" integer NOT NULL,
	"user_id" bigint NOT NULL,
	"score" integer NOT NULL,
	"rank" integer,
	"status" "raffle_result_status" DEFAULT 'pending' NOT NULL,
	"wallet_address" text NOT NULL,
	"reward_nanoton" bigint,
	"tx_hash" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_raffles" (
	"raffle_id" serial PRIMARY KEY NOT NULL,
	"raffle_uuid" uuid NOT NULL,
	"event_id" integer NOT NULL,
	"top_n" integer DEFAULT 10 NOT NULL,
	"prize_pool_nanoton" bigint,
	"status" "raffle_status" DEFAULT 'waiting_funding' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_raffle_results" ADD CONSTRAINT "event_raffle_results_raffle_id_event_raffles_raffle_id_fk" FOREIGN KEY ("raffle_id") REFERENCES "public"."event_raffles"("raffle_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_raffle_results" ADD CONSTRAINT "event_raffle_results_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_raffles" ADD CONSTRAINT "event_raffles_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_raffle_results_unique" ON "event_raffle_results" USING btree ("raffle_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_raffle_results_raffle_idx" ON "event_raffle_results" USING btree ("raffle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_raffle_results_score_idx" ON "event_raffle_results" USING btree ("score");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_raffles_uuid_unique" ON "event_raffles" USING btree ("raffle_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_raffles_event_idx" ON "event_raffles" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_giveaway_wallet_address_idx" ON "events" USING btree ("wallet_address");