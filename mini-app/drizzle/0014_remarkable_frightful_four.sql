CREATE TABLE IF NOT EXISTS "giata_city" (
	"id" integer PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"parent_id" integer NOT NULL,
	"insert_date" integer NOT NULL,
	"abbreviated_code" text NOT NULL,
	"giata_code" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "city_id" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "country_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_title_idx" ON "giata_city" USING btree ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_parent_id_idx" ON "giata_city" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_insert_date_idx" ON "giata_city" USING btree ("insert_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_abbreviated_code_idx" ON "giata_city" USING btree ("abbreviated_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "giata_city_giata_code_idx" ON "giata_city" USING btree ("giata_code");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_city_id_giata_city_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."giata_city"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "events" ADD CONSTRAINT "events_country_id_giata_city_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."giata_city"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
