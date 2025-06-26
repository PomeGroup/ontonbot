CREATE TABLE IF NOT EXISTS "event_wallets" (
	"wallet_id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"wallet_address" text NOT NULL,
	"public_key" text,
	"mnemonic" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp (3)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_wallets" ADD CONSTRAINT "event_wallets_event_id_events_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("event_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "event_wallets_event_id_unique" ON "event_wallets" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_wallets_wallet_address_idx" ON "event_wallets" USING btree ("wallet_address");