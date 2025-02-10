ALTER TABLE "events" RENAME COLUMN "collection_address" TO "sbt_collection_address";--> statement-breakpoint
ALTER TABLE "event_registrants" ALTER COLUMN "event_uuid" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "image_url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "owner" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "has_payment" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "has_payment" SET NOT NULL;