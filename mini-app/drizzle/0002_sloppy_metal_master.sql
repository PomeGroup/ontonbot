SCREATE TABLE IF NOT EXISTS "sbt_reward_collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"hubID" integer,
	"hubName" varchar,
	"videoLink" varchar,
	"imageLink" varchar
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "special_guests" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"surname" varchar(255),
	"company" varchar(255),
	"position" varchar(255),
	"telegram" varchar(255),
	"user_id" integer,
	"type" varchar(255),
	"event_uuid" uuid
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "ts_reward_video" text;