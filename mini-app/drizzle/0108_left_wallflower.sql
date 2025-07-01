ALTER TABLE "event_merch_prize_results" ALTER COLUMN "merch_prize_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "event_merch_prize_results" ADD COLUMN "merch_raffle_id" integer NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_merch_prize_results" ADD CONSTRAINT "event_merch_prize_results_merch_raffle_id_event_merch_raffles_merch_raffle_id_fk" FOREIGN KEY ("merch_raffle_id") REFERENCES "public"."event_merch_raffles"("merch_raffle_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "merch_spin_unique" ON "event_merch_prize_results" USING btree ("merch_raffle_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "merch_results_raffle_idx" ON "event_merch_prize_results" USING btree ("merch_raffle_id");