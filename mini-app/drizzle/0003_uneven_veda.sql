DO $$ BEGIN
 CREATE TYPE "reward_types" AS ENUM('ton_society_sbt');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"visitor_id" serial NOT NULL,
	"type" "reward_types",
	"data" json,
	"claimed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "id" serial NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewards" ADD CONSTRAINT "rewards_visitor_id_visitors_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "visitors"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
