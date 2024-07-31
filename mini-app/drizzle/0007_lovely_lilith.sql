ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "visitors" ADD COLUMN "last_visit" timestamp DEFAULT now();

UPDATE "visitors" SET "last_visit"="visitors"."created_at";
